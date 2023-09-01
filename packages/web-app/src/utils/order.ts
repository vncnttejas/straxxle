import { memoize } from 'lodash';
import { IdType } from './types';

export const freezeQty = 18;
const symbolRegexStr =
  '^NSE:(NIFTY|BANKNIFTY|FINNIFTY)([0-9]{2}[A-Z0-9]{3})([0-9]{3,6})([A-Z]{2})$';
const optSymbolRegex = new RegExp(symbolRegexStr);

export const computeQtyOptions = memoize((qty = freezeQty * 5) => {
  const options = [];
  for (let i = 1; i <= qty; i++) {
    const iStr = i.toString();
    options.push(iStr);
  }
  return options;
});


export const flipOrderType = memoize((orderType: string) => {
  return orderType === 'BUY' ? 'SELL' : 'BUY';
});

export const processSymbol = memoize((symbol) => {
  const match = optSymbolRegex.exec(symbol);
  if (!match) {
    throw new Error(`Invalid symbol ${symbol}`);
  }
  const [_, index, rawExpiry, strikePrice, contractType] = match;
  return {
    index,
    rawExpiry,
    strikePrice,
    contractType,
  };
});

export const getNextStrikeSymbol = (
  symbol: IdType,
  step = 1,
  strikeStep = 50
) => {
  const { index, rawExpiry, strikePrice, contractType } = processSymbol(symbol);
  const newStrikeNum = parseInt(strikePrice) + step * strikeStep;
  return `NSE:${index}${rawExpiry}${newStrikeNum}${contractType}`;
};
