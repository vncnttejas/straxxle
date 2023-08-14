export interface Filtered {
  data: StrikeDataType[];
  CE: FilteredCE;
  PE: FilteredCE;
}

export interface FilteredCE {
  totOI: number;
  totVol: number;
}

export interface StrikeDataType {
  strikePrice: number;
  expiryDate: string;
  PE?: OptionDataType;
  CE?: OptionDataType;
}

export interface OptionDataType {
  strikePrice: number;
  expiryDate: ExpiryDate;
  underlying: string;
  identifier: string;
  openInterest: number;
  changeinOpenInterest: number;
  pchangeinOpenInterest: number;
  totalTradedVolume: number;
  impliedVolatility: number;
  lastPrice: number;
  change: number;
  pChange: number;
  totalBuyQuantity: number;
  totalSellQuantity: number;
  bidQty: number;
  bidprice: number;
  askQty: number;
  askPrice: number;
  underlyingValue: number;
}

export type ExpiryDate = Record<string, string>;

export interface OptionChainRecords {
  expiryDates: ExpiryDate[];
  data: StrikeDataType[];
  timestamp: string;
  underlyingValue: number;
  strikePrices: number[];
}

export type OptionChainListType = Record<string, Record<string, Record<string, OptionDataType>>>;
