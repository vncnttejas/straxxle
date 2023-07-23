import { Inject, Injectable } from '@nestjs/common';
import { get, set } from 'lodash';
import { EnrichedOptiontick, OptionRecordType, Optiontick } from '../types';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CommonService } from '../common/common.service';

@Injectable()
export class TapeService {
  private tape = {} as OptionRecordType;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache, private commonService: CommonService) {}

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
}
