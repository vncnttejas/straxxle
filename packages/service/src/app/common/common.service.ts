import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { keys, values } from 'lodash';
import { IndexSymbolObjType } from '../types/index-symbol-obj.type';
import { SymbolData } from '../types/symbol-data.type';
const fyersApiV2 = require('fyers-api-v2');

@Injectable()
export class CommonService {
  private readonly logger = new Logger(CommonService.name);

  readonly monthMap = {
    JAN: 0,
    FEB: 1,
    MAR: 2,
    APR: 3,
    MAY: 4,
    JUN: 5,
    JUL: 6,
    AUG: 7,
    SEP: 8,
    OCT: 9,
    NOV: 10,
    DEC: 11,
  };

  readonly singleDigitMonthMap = {
    O: 10,
    N: 11,
    D: 12,
  };

  constructor(private readonly configService: ConfigService) {}

  addSup(num: number): string {
    const val = (num - 1) % 10;
    let sup: string;
    if (val === 1) sup = 'st';
    if (val === 2) sup = 'nd';
    if (val === 3) sup = 'rd';
    return `${num - 1}${sup || 'th'}`;
  }

  getATMStrikeNumfromCur(current: number, strikeDiff: number) {
    return Math.round(current / strikeDiff) * strikeDiff;
  }

  prepareSymbolList(symbol: string, atm: number, rawExpiry: string): string[] {
    const defaultSymbols = this.configService.get('defaultSymbols') as IndexSymbolObjType;
    const { prefix, strikeDiff, strikeExtreme } = defaultSymbols[symbol];
    const contractTypes = ['CE', 'PE'];
    const firstStrike = atm - strikeExtreme;
    const lastStrike = atm + strikeExtreme;
    const strikes = [];
    for (let i = firstStrike; i <= lastStrike; i += strikeDiff) {
      for (const contractType of contractTypes) {
        strikes.push(`${prefix}${rawExpiry}${i}${contractType}`);
      }
    }
    return strikes;
  }

  getLastThursdayOfMonth(year: number, month: number): Date {
    const lastDay = new Date(year, month + 1, 0);
    let lastThursday = new Date(year, month, lastDay.getDate() - lastDay.getDay() + 4);
    if (lastThursday.getMonth() !== month) {
      lastThursday = new Date(year, month, lastDay.getDate() - lastDay.getDay() - 2);
    }
    return lastThursday;
  }

  processOptionSymbol(symbol: string): SymbolData {
    const symbolRegexStr = this.configService.get('symbolRegexStr');
    const optSymbolRegex = new RegExp(symbolRegexStr);
    const [_, index, rawExpiry, strikeNum, contractType] = optSymbolRegex.exec(symbol);
    return {
      index,
      indexSymbol: this.getSymbolByIndexName(index).symbol,
      rawExpiry,
      strikeNum: parseInt(strikeNum, 10),
      contractType,
    };
  }

  computeStrikeType(strikeNum: number, current: number, contractType: string): string {
    const strikeDiff = strikeNum - current;
    if (strikeDiff > 25) {
      return contractType === 'PE' ? 'itm' : 'otm';
    }
    if (strikeDiff < -25) {
      return contractType === 'PE' ? 'otm' : 'itm';
    }
    return 'atm';
  }

  processExpiry(rawExpiry: string): { expiryType: string; expiryDate: Date } {
    const match = /^([0-9]{2})([a-z0-9])([0-9]{2})$/i.exec(rawExpiry);
    if (match?.[0]) {
      const [_, year, month, day] = match;
      const monthNum = this.singleDigitMonthMap[month.toUpperCase()] || parseInt(month, 10) - 1;
      return {
        expiryType: 'weekly',
        expiryDate: new Date(+`20${year}`, monthNum, +day + 1),
      };
    }
    const year = rawExpiry.slice(0, 2);
    const month = rawExpiry.slice(2, 5);
    return {
      expiryType: 'monthly',
      expiryDate: this.getLastThursdayOfMonth(+`20${year}`, this.monthMap[month]),
    };
  }

  async fetchSymbolData(symbol: string): Promise<number> {
    const quotes = new fyersApiV2.quotes();
    const current = await quotes.setSymbol(symbol).getQuotes();
    return current.d[0].v.lp;
  }

  /**
   * Returns list of default index symbols
   * @returns default symbol
   */
  getDefaultSymbols(): string[] {
    const defaultSymbols = this.configService.get('defaultSymbols') as IndexSymbolObjType;
    return keys(defaultSymbols);
  }

  getSymbolByIndexName(indexName: string) {
    const defaultSymbols = this.configService.get('defaultSymbols') as IndexSymbolObjType;
    const indexSymbol = values(defaultSymbols).filter((symbolObj) => symbolObj.shortName === indexName);
    return indexSymbol[0];
  }

  getIndexShortNameBySymbol(indexSymbol: string): string {
    const defaultSymbols = this.configService.get('defaultSymbols') as IndexSymbolObjType;
    return defaultSymbols?.[indexSymbol].shortName;
  }

  getLotSizeBySymbol(indexSymbol: string): number {
    const defaultSymbols = this.configService.get('defaultSymbols') as IndexSymbolObjType;
    return defaultSymbols?.[indexSymbol].lotSize;
  }
}
