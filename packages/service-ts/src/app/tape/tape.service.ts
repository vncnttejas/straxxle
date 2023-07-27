import { Injectable, Logger } from '@nestjs/common';
import { chunk, get, keys, set, values } from 'lodash';
import fyersApiV2 from 'fyers-api-v2';
import { Enrichedtick, TickRecordType, Optiontick } from '../types';
import { ConfigService } from '@nestjs/config';
import { IndexSymbolObjType } from '../types/index-symbol-obj.type';
import { StoreService } from '../common/store.service';
import { CommonService } from '../common/common.service';

@Injectable()
export class TapeService {
  private readonly logger = new Logger(TapeService.name);

  private tape = {} as TickRecordType;

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

  constructor(
    private storeService: StoreService,
    private commonService: CommonService,
    private readonly configService: ConfigService,
  ) {}

  getStrikeData(strike: string): Enrichedtick {
    const strikeData = get(this.tape, strike);
    if (!strikeData) {
      throw new Error(`Strike ${strike} not found in tape`);
    }
    return strikeData;
  }

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

  async enrichOptionStrikeData(tick: Optiontick): Promise<Enrichedtick> {
    const { symbol } = tick;
    const defaultSymbols = this.configService.get('defaultSymbols') as IndexSymbolObjType;
    if (keys(defaultSymbols).includes(symbol)) {
      return tick;
    }
    const { index, indexSymbol, rawExpiry, strikeNum, contractType } = this.commonService.processOptionSymbol(symbol);
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
    };
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
      fyersApiV2.fyers_connect(request, async (data: string) => {
        const tickUpdate = JSON.parse(data);
        if (tickUpdate.d?.['7208']?.length) {
          const strikeData = tickUpdate.d['7208'][0].v as Optiontick;
          const { symbol } = strikeData;
          const enrichedOptiontick = await this.enrichOptionStrikeData(strikeData);
          this.setTapeData(symbol, enrichedOptiontick);
        }
      });
    });
  }
}
