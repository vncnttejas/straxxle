import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { map, memoize, pick, values } from 'lodash';
import { IndexSymbolObjType, IndexSymbolObjValue } from '../types/index-symbol-obj.type';
import fyersApiV2 from 'fyers-api-v2';

@Injectable()
export class CommonService {
  private readonly logger = new Logger(CommonService.name);

  readonly monthMap = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  readonly singleDigitMonthMap = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'O', 'N', 'D'];

  constructor(private readonly configService: ConfigService) {}

  addSup(num: number): string {
    const val = num % 10;
    let sup: string = 'th';
    if (val === 1) sup = 'st';
    else if (val === 2) sup = 'nd';
    else if (val === 3) sup = 'rd';
    return `${num}${sup}`;
  }

  getATMStrikeNumfromCur(current: number, strikeDiff: number) {
    return Math.round(current / strikeDiff) * strikeDiff;
  }

  prepareSymbolList(symbol: string, atm: number, rawExpiry: string): string[] {
    const defaultSymbols = this.configService.get('defaultSymbols') as IndexSymbolObjType;
    const { indexPrefix, strikeDiff, strikeExtreme } = defaultSymbols[symbol];
    const contractTypes = ['CE', 'PE'];
    const firstStrike = atm - strikeExtreme;
    const lastStrike = atm + strikeExtreme;
    const strikes = [];
    for (let i = firstStrike; i <= lastStrike; i += strikeDiff) {
      for (const contractType of contractTypes) {
        strikes.push(`${indexPrefix}${rawExpiry}${i}${contractType}`);
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

  computeStrikeType(strikePrice: number, current: number, contractType: string): string {
    const strikeDiff = strikePrice - current;
    if (strikeDiff > 25) {
      return contractType === 'PE' ? 'itm' : 'otm';
    }
    if (strikeDiff < -25) {
      return contractType === 'PE' ? 'otm' : 'itm';
    }
    return 'atm';
  }

  processExpiry(rawExpiry: string): { expiryType: string; optionExpiry: Date } {
    const match = /^([0-9]{2})([a-z0-9])([0-9]{2})$/i.exec(rawExpiry);
    if (match?.[0]) {
      const [_, year, month, day] = match;
      const monthNum = this.singleDigitMonthMap[month.toUpperCase()] || parseInt(month, 10) - 1;
      return {
        expiryType: 'weekly',
        optionExpiry: new Date(+`20${year}`, monthNum, +day + 1),
      };
    }
    const year = rawExpiry.slice(0, 2);
    const month = rawExpiry.slice(2, 5);
    return {
      expiryType: 'monthly',
      optionExpiry: this.getLastThursdayOfMonth(+`20${year}`, this.monthMap[month]),
    };
  }

  async fetchSymbolData(symbol: string): Promise<number> {
    const quotes = new fyersApiV2.quotes();
    const current = await quotes.setSymbol(symbol).getQuotes();
    return current.d[0].v.lp;
  }

  /**
   * Returns field of default indexes specified
   * @returns field of the index object
   */
  getIndexFields(keys: Array<keyof IndexSymbolObjValue>): Pick<IndexSymbolObjValue, keyof IndexSymbolObjValue>[] {
    const defaultSymbols = this.configService.get('defaultSymbols') as IndexSymbolObjType;
    return map(defaultSymbols, (obj) => pick(obj, keys));
  }

  /**
   * Get the index symbol by providing the shortname
   * @param shortName string
   * @returns indexSymbol field of the index object
   */
  private getIndexObjByIndexName(shortName: string) {
    const defaultSymbols = this.configService.get('defaultSymbols') as IndexSymbolObjType;
    const indexSymbol = values(defaultSymbols).filter((symbolObj) => symbolObj.indexShortName === shortName);
    if (indexSymbol.length) {
      return indexSymbol[0];
    }
    throw new Error(`Invalid shortName provided: ${shortName}`);
  }

  /**
   * Memoized version of getIndexObjByIndexName
   */
  memoGetIndexObjByIndexName = memoize(this.getIndexObjByIndexName);

  getIndexShortNameBySymbol(indexSymbol: string): string {
    const defaultSymbols = this.configService.get('defaultSymbols') as IndexSymbolObjType;
    return defaultSymbols?.[indexSymbol].indexShortName;
  }

  getLotSizeBySymbol(indexSymbol: string): number {
    const defaultSymbols = this.configService.get('defaultSymbols') as IndexSymbolObjType;
    return defaultSymbols?.[indexSymbol].lotSize;
  }

  /**
   * @param date
   * @returns YYYY-MM-DD string back
   */
  getStandardDateFmt(date: Date): string {
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: '2-digit' });
    const day = date.toLocaleString('default', { day: '2-digit' });
    return `${year}-${month}-${day}`;
  }

  memoGetStandardDateFmt = memoize(this.getStandardDateFmt);

  processIdSymbol(identifier: string) {
    const reg = '^OPTIDX(NIFTY|FINNIFTY|BANKNIFTY)(\\d{1,2}\\-\\d{1,2}-\\d{4})(CE|PE)(\\d+)?.\\d{2}$';
    const idRegex = new RegExp(reg);
    const [_match, indexName, expDate, contractType, strikePrice] = idRegex.exec(identifier);
    return { indexName, expDate, contractType, strikePrice };
  }

  memoProcessIdSymbol = memoize(this.processIdSymbol);

  isMonthlyExpiry(expiryEpoch: number) {
    const expiryDate = new Date(expiryEpoch);
    const expiryMonth = expiryDate.getMonth();
    const copyiedDate = new Date(expiryEpoch);
    copyiedDate.setDate(copyiedDate.getDate() + 7);
    const expiryPlus7Month = copyiedDate.getMonth();
    return expiryMonth !== expiryPlus7Month;
  }

  memoIsMonthlyExpiry = memoize(this.isMonthlyExpiry);

  createSymbolDateStr(expiryEpoch: number): string {
    const expiryDate = new Date(expiryEpoch);
    const isMontlyExpiry = this.memoIsMonthlyExpiry(expiryEpoch);
    const year2Digit = expiryDate.getFullYear() % 100;
    const monthIdx = expiryDate.getMonth();
    if (isMontlyExpiry) {
      const monthShortName = this.monthMap[monthIdx];
      return `${year2Digit}${monthShortName}`;
    }
    const dayStr = expiryDate.getDate().toString();
    const monthStr = this.singleDigitMonthMap[monthIdx];
    return `${year2Digit}${monthStr}${dayStr.padStart(2, '0')}`;
  }

  memoCreateSymbolDateStr = memoize(this.createSymbolDateStr);

  convertIdtoStrikeSymbol(identifier: string): string {
    const { indexName, expDate, contractType, strikePrice } = this.memoProcessIdSymbol(identifier);
    const [dayStr, monthStr, yearStr] = expDate.split('-');
    const monthNum = +monthStr;
    const monthIdx = monthNum - 1;
    const dateStr = this.memoCreateSymbolDateStr(new Date(+yearStr, monthIdx, +dayStr).getTime());
    return `NSE:${indexName}${dateStr}${strikePrice}${contractType}`;
  }

  memoConvertIdtoStrikeSymbol = memoize(this.convertIdtoStrikeSymbol);
}
