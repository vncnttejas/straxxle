// Compute qty option list

import { memoize } from 'lodash';

export const freezeQty = 18;
const symbolRegexStr =
  '^NSE:(NIFTY|BANKNIFTY|FINNIFTY)([0-9]{2}[A-Z0-9]{3})([0-9]{3,6})([A-Z]{2})$';
const optSymbolRegex = new RegExp(symbolRegexStr);

export const computeQtyOptions = (qty = freezeQty * 5) => {
  const options = [];
  for (let i = 1; i <= qty; i++) {
    const iStr = i.toString();
    // const fqStr = i && i % freezeQty === 0 ? `${parseInt(i / freezeQty)}FQ` : false;
    // const aka = fqStr ? `${i} ${fqStr}` : iStr;

    options.push(iStr);
  }
  return options;
};


export const flipOrderType = (orderType) => {
  return orderType === 'BUY' ? 'SELL' : 'BUY';
};

export const processSymbol = memoize((symbol) => {
  const [_, index, rawExpiry, strikeNum, contractType] =
    optSymbolRegex.exec(symbol);
  return {
    index,
    rawExpiry,
    strikeNum,
    contractType,
  };
});

export const getNextStrikeSymbol = (symbol, step = 1, strikeStep = 50) => {
  const { index, rawExpiry, strikeNum, contractType } = processSymbol(symbol);
  const newStrikeNum = parseInt(strikeNum) + step * strikeStep;
  return `NSE:${index}${rawExpiry}${newStrikeNum}${contractType}`;
};
