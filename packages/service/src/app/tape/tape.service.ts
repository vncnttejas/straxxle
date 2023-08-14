import { Injectable, Logger } from '@nestjs/common';
import { chunk, forEach, get, keys, set, values } from 'lodash';
import fyersApiV2 from 'fyers-api-v2';
import { Enrichedtick, TickRecordType, Optiontick } from '../types';
import { ConfigService } from '@nestjs/config';
import { IndexSymbolObjType } from '../types/index-symbol-obj.type';
import { StoreService } from '../common/store.service';
import { CommonService } from '../common/common.service';
import { OptionChainListType, OptionDataType, StrikeDataType } from './types/option-chain.type';
import { HttpService } from '@nestjs/axios';
import { catchError, map, merge, retry, switchMap, tap, throwError, timer } from 'rxjs';

@Injectable()
export class TapeService {
  private readonly logger = new Logger(TapeService.name);

  private tape = {} as TickRecordType;
  private liveTapeContext: string = null;
  private _streamLive = false;
  private optionChainVolumeData: Record<string, OptionDataType> = {};
  private readonly reqFields = [
    'symbol',
    'index',
    'strike',
    'strikeNum',
    'strikeType',
    'contractType',
    'expiryType',
    'expiryDate',
    'lp',
    'short_name',
  ];
  private oiStats = {};

  constructor(
    private readonly httpService: HttpService,
    private storeService: StoreService,
    private commonService: CommonService,
    private readonly configService: ConfigService,
  ) {}

  getLiveTapeContext() {
    return this.liveTapeContext;
  }

  setLiveTapeContext(value: string) {
    this.liveTapeContext = value;
  }

  get streamLive() {
    return this._streamLive;
  }

  set streamLive(value: boolean) {
    this._streamLive = value;
  }

  /**
   * Returns a enriched strike object by symbol
   * @param strike Strike symbol
   * @returns Enriched strike object filtered by the symbol string
   */
  getStrikeData(strike: string): Enrichedtick {
    const strikeData = get(this.tape, strike);
    if (!strikeData) {
      this.logger.error(`Strike ${strike} not found in tape`);
    }
    return strikeData;
  }

  /**
   * @returns The complete enriched tape indexed by symbol
   */
  getTapeData(): TickRecordType {
    return this.tape;
  }

  filterTape(
    callback: (value: Enrichedtick, index?: number, array?: Enrichedtick[]) => Enrichedtick[],
  ): Enrichedtick[] {
    return values(this.tape).filter(callback);
  }

  setTapeData(symbol: string, data: Enrichedtick): void {
    set(this.tape, symbol, data);
  }

  enrichOptionStrikeData(tick: Optiontick): Enrichedtick {
    const { symbol } = tick;
    const defaultSymbols = this.configService.get('defaultSymbols') as IndexSymbolObjType;
    if (keys(defaultSymbols).includes(symbol)) {
      return tick;
    }
    const { index, indexSymbol, rawExpiry, strikeNum, contractType } =
      this.commonService.processOptionSymbol(symbol);
    const current = this.storeService.getStoreData<number>(`currentValues.${indexSymbol}`);
    if (!current) {
      throw new Error(`Live symbol data not found for ${symbol}`);
    }
    const { strikeDiff } = defaultSymbols[indexSymbol];
    const atm = this.commonService.getATMStrikeNumfromCur(current, strikeDiff);
    const { expiryType, expiryDate } = this.commonService.processExpiry(rawExpiry);
    const strikeDiffPts = contractType === 'PE' ? atm - strikeNum : strikeNum - atm;
    const strikeType = this.commonService.computeStrikeType(strikeNum, current, contractType);
    const strikesAway = strikeDiffPts / strikeDiff;
    const strike = `${strikeNum}${contractType}`;
    const optionVolume = this.enrichWithOptionVolume(indexSymbol, strike, expiryDate);
    return {
      index,
      indexSymbol,
      rawExpiry,
      strike,
      strikeNum,
      strikeDiffPts,
      strikesAway,
      strikeType,
      contractType,
      expiryType,
      expiryDate,
      ...tick,
      ...optionVolume,
    };
  }

  enrichWithOptionVolume(indexSymbol: string, strike: string, expiryDate: Date) {
    const date = this.commonService.memoGetStandardDateFmt(new Date(expiryDate));
    const statPath = `${indexSymbol}.${date}`;
    const optionChainData = get(this.optionChainVolumeData, `${indexSymbol}.${date}.${strike}`);
    const optionOiState = get(this.oiStats, statPath) as { highOi: number; highChangeInOi: number };
    const oiPercentile = optionOiState?.highOi
      ? (optionChainData?.openInterest || 0) / optionOiState.highOi
      : 0;
    set(optionChainData, 'oiPercentile', oiPercentile);
    return optionChainData;
  }

  async triggerListen(): Promise<void> {
    this.logger.verbose('Triggering listen for symbol updates');
    const maxWatchItems = this.configService.get('maxWatchItems');
    const watchListSymbols = this.storeService.getStoreData<string[]>('watchList');
    this.logger.log(watchListSymbols, 'Listening for symbol updates');
    const chunkedWatchLists = chunk(watchListSymbols, maxWatchItems);
    const { appSecret: token } = this.configService.get('broker');
    chunkedWatchLists.forEach((watchListChunk) => {
      const request = {
        symbol: watchListChunk,
        dataType: 'symbolUpdate',
        token,
      };
      fyersApiV2.fyers_connect(request, (data: string) => {
        const tickUpdate = JSON.parse(data);
        if (tickUpdate.d?.['7208']?.length) {
          const strikeData = tickUpdate.d['7208'][0].v as Optiontick;
          const { symbol } = strikeData;
          const enrichedOptiontick = this.enrichOptionStrikeData(strikeData);
          this.setTapeData(symbol, enrichedOptiontick);
        }
      });
    });
  }

  /**
   * Fetch nifty option chain from nse site
   * @returns Option chain data
   */
  watchOptionChainData(): void {
    // 90 seconds
    timer(0, 60 * 1000)
      .pipe(
        switchMap(() => {
          const defaultSymbols = this.commonService.getIndexFields(['shortName']);
          const ocReqs = defaultSymbols.map(({ shortName }) =>
            this.httpService.get(
              `https://www.nseindia.com/api/option-chain-indices?symbol=${shortName}`,
            ),
          );
          return merge(...ocReqs);
        }),
        catchError((error) => {
          this.logger.error(error);
          return throwError(() => error);
        }),
        retry({
          count: 3,
          delay: 1000 * 90,
          resetOnSuccess: true,
        }),
        map((data) => {
          const recordData = get(data, 'data.records.data') as StrikeDataType[];
          const optionChainList: OptionChainListType = {};
          forEach(recordData, (option) => {
            const { symbol } = this.commonService.memoGetIndexObjByIndexName(
              option?.CE?.underlying || option?.PE?.underlying,
            );
            const dateFmt = this.commonService.memoGetStandardDateFmt(new Date(option.expiryDate));
            const path = `${symbol}.${dateFmt}.${option.strikePrice}`;
            set(optionChainList, `${path}PE`, option.PE);
            set(optionChainList, `${path}CE`, option.CE);
          });
          return optionChainList;
        }),
        tap((data) => {
          forEach(data, (optionChain, symbol) => {
            forEach(optionChain, (optionList, expiry) => {
              let highOi = -Infinity;
              forEach(optionList, (option) => {
                highOi = highOi > (option?.openInterest ?? 0) ? highOi : option?.openInterest;
              });
              set(this.oiStats, `${symbol}.${expiry}.highOi`, highOi);
            });
          });
        }),
      )
      .subscribe({
        next: (optionChain) => {
          set(this.optionChainVolumeData, keys(optionChain)[0], values(optionChain)[0]);
        },
      });
  }
}
