import { Inject, Injectable, Logger } from '@nestjs/common';
import { chunk, flatten, get, set } from 'lodash';
import fyersApiV2 from 'fyers-api-v2';
import { EnrichedOptiontick, OptionRecordType, Optiontick } from '../types';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CommonService } from '../common/common.service';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { FyersCred } from '../token/types';

@Injectable()
export class TapeService {
  private readonly logger = new Logger(TapeService.name);

  private tape = {} as OptionRecordType;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private commonService: CommonService,
    private readonly configService: ConfigService,
  ) {}

  getTape(param: string | Function | undefined) {
    if (typeof param === 'string') {
      return get(this.tape, param) as EnrichedOptiontick;
    }
    if (typeof param === 'function') {
      return param(this.tape) as EnrichedOptiontick;
    }
    return this.tape as OptionRecordType;
  }

  setTape(symbol: string, data: Partial<EnrichedOptiontick>): void {
    set(this.tape, symbol, data);
  }

  async enrichOptionStrikeData(tick: Optiontick): Promise<EnrichedOptiontick> {
    const { symbol } = tick;
    const { index, rawExpiry, strikeNum, contractType } = this.commonService.processSymbol(symbol);
    const liveSymbolData = await this.cacheManager.get(`liveSymbolData`);
    const { current } = liveSymbolData[symbol];
    const defaultSymbols = await this.cacheManager.get('defaultSymbols');
    const { strikeDiff } = defaultSymbols[index];
    const atm = this.commonService.getATMStrikeNumfromCur(current, strikeDiff);
    const { expiryType, expiryDate } = await this.commonService.processExpiry(rawExpiry);
    const strikeDiffPts = contractType === 'PE' ? atm - strikeNum : strikeNum - atm;
    const strikeType = this.commonService.computeStrikeType(strikeNum, current, contractType);
    const strikesAway = strikeDiffPts / strikeDiff;
    const strike = `${strikeNum}${contractType}`;
    return {
      index,
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

  @OnEvent('watchListUpdate', { async: true })
  async triggerListen(): Promise<void> {
    this.logger.verbose('Triggering listen for symbol updates');
    const maxWatchItems = this.configService.get('maxWatchItems');
    const watchListSymbols = await this.cacheManager.get<string[]>('watchList');
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
          this.setTape(symbol, strikeData);
        }
      });
    });
  }
}
