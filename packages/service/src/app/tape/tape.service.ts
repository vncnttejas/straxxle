import { Injectable, Logger } from '@nestjs/common';
import { chunk, forEach, get, keys, set, values } from 'lodash';
import fyersApiV2 from 'fyers-api-v2';
import { Enrichedtick, TickRecordType, Optiontick } from '../types';
import { ConfigService } from '@nestjs/config';
import { IndexSymbolObjType } from '../types/index-symbol-obj.type';
import { CommonService } from '../common/common.service';
import { OptionChainRecords, StrikeDataType } from './types/option-chain.type';
import { HttpService } from '@nestjs/axios';
import { catchError, from, merge, retry, switchMap, tap, throwError, timer } from 'rxjs';

@Injectable()
export class TapeService {
  private readonly logger = new Logger(TapeService.name);
  private tape = {} as TickRecordType;
  private liveTapeContext: string = null;
  private _streamLive = false;
  // Values extracted from nifty option chain
  private optionChainData: Record<string, OptionChainRecords> = {};

  constructor(
    private readonly httpService: HttpService,
    private commonService: CommonService,
    private readonly configService: ConfigService,
  ) {
    this.fetchNSEOptionChainData().subscribe();
  }

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

  get optionChains() {
    return this.optionChainData;
  }

  /**
   * Returns a enriched strike object by symbol
   * @param strike Strike symbol
   * @returns Enriched strike object filtered by the symbol string
   */
  getStrikeData(strike: string): Enrichedtick {
    const strikeData = get(this.tape, strike);
    if (!strikeData) {
      // Usually hit when an item is present in the position list but not in tape
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

  getStrikeByStrikeSymbol(strikeSymbol: string): Partial<Enrichedtick> {
    return get(this.tape, strikeSymbol);
  }

  getMaxOiForChain(indexSymbol: string, expiryStr: string): number {
    return this.optionChains?.[indexSymbol]?.ocs?.[expiryStr]?.maxOi || 1;
  }

  setTapeData(symbol: string, data: Partial<Enrichedtick>): void {
    set(this.tape, symbol, data);
  }

  updateStrikeData(symbol: string, data: Partial<Enrichedtick>): void {
    set(this.tape, symbol, {
      ...this.tape[symbol],
      ...data,
    });
  }

  async triggerListen(): Promise<void> {
    this.logger.verbose('Triggering listen for symbol updates');
    const maxWatchItems = this.configService.get('maxWatchItems');
    const chunkedWatchLists = chunk(keys(this.tape), maxWatchItems);
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
          const strikeTick = tickUpdate.d['7208'][0].v as Optiontick;
          const { symbol } = strikeTick;
          const strikeData = this.getStrikeByStrikeSymbol(symbol);
          const { strikeDiff, contractType, strikePrice, indexSymbol, expiryDateStr } = strikeData;

          // Enrich option data
          const current = this.optionChainData[strikeData.indexSymbol].underlyingValue;
          const atm = this.commonService.getATMStrikeNumfromCur(current, strikeDiff);

          const strikeDiffPts = contractType === 'PE' ? atm - strikePrice : strikePrice - atm;
          const strikeType = this.commonService.computeStrikeType(strikePrice, current, contractType);
          const strikesAway = strikeDiffPts / strikeDiff;
          const strike = `${strikePrice}${contractType}`;

          // Compute OiPercentile
          const maxOi = this.getMaxOiForChain(indexSymbol, expiryDateStr);
          const oiPercentile = maxOi ? (+strikeData?.openInterest || 0) / maxOi : 0;

          this.updateStrikeData(symbol, {
            ...strikeTick,
            symbol,
            indexSymbol,
            strike,
            strikeDiffPts,
            strikesAway,
            strikeType,
            contractType,
            oiPercentile,
          });
        }
      });
    });
  }

  /**
   * Fetch nifty option chain from nse site
   * @returns Option chain data
   */
  fetchNSEOptionChainData() {
    // 60 seconds
    let responseCookie = '';
    return timer(0, 30 * 1000).pipe(
      // Fetch data from remote json
      switchMap(() => {
        const defaultSymbols = this.commonService.getIndexFields(['indexShortName']);
        const headers = {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en,en-US;q=0.9',
          'Cache-Control': 'max-age=0',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',

          ...(responseCookie.length
            ? {
                Cookie: responseCookie,
              }
            : {}),
        };
        const ocReqs = defaultSymbols.map(({ indexShortName }) =>
          this.httpService.get(`https://www.nseindia.com/api/option-chain-indices?symbol=${indexShortName}`, {
            withCredentials: true,
            headers,
          }),
        );
        return merge(...ocReqs);
      }),
      // Catch Error if any
      catchError((error) => {
        this.logger.error(error);
        return throwError(() => error);
      }),
      // 90 seconds
      retry({
        count: 3,
        delay: 1000 * 10,
        resetOnSuccess: true,
      }),

      tap((data) => {
        responseCookie = data.headers['set-cookie'][0];
      }),
      // Extract values
      switchMap((data) => {
        const recordData = get(data, 'data.records.data') as StrikeDataType[];
        const { indexSymbol } = this.commonService.memoGetIndexObjByIndexName(
          recordData?.[0]?.CE?.underlying || recordData?.[0]?.PE?.underlying,
        );
        set(this.optionChainData, `${indexSymbol}.expiryDates`, get(data, 'data.records.expiryDates'));
        set(this.optionChainData, `${indexSymbol}.timestamp`, get(data, 'data.records.timestamp'));
        set(this.optionChainData, `${indexSymbol}.underlyingValue`, get(data, 'data.records.underlyingValue'));

        return from(recordData).pipe(
          // Tap each record and build a Record List of option strikes
          tap((option) => {
            const dateFmt = this.commonService.memoGetStandardDateFmt(new Date(option.expiryDate));
            const path = `${indexSymbol}.ocs.${dateFmt}`;
            const defaultSymbols = this.configService.get('defaultSymbols') as IndexSymbolObjType;
            forEach(['CE', 'PE'], (contractType) => {
              if (option[contractType] !== undefined) {
                // Set strike data
                const strikePath = `${path}.optionChainData.${option.strikePrice}${contractType}`;
                const strikeData = {
                  ...option[contractType],
                  ...defaultSymbols[indexSymbol],
                  contractType,
                  expiryDateStr: dateFmt,
                };
                set(this.optionChainData, strikePath, strikeData);

                // Extract highestOi data
                const maxOi = get(this.optionChainData, `${path}.maxOi`) || 0;
                const strikeOi = option[contractType].openInterest;
                set(this.optionChainData, `${path}.maxOi`, strikeOi > maxOi ? strikeOi : maxOi);
              }
            });
          }),
        );
      }),
    );
  }
}
