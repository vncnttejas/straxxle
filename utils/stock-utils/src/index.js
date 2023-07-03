import { memoize } from 'lodash';

export const symbolRegexStr = '^NSE:(NIFTY|BANKNIFTY|FINNIFTY)([0-9]{2}[A-Z0-9]{3})([0-9]{3,6})([A-Z]{2})$';
export const optSymbolRegex = new RegExp(symbolRegexStr);

export const monthMap = {
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

export const singleDigitMonthMap = {
  O: 10,
  N: 11,
  D: 12,
};

export const processExpiry = memoize((rawExpiry) => {
  const match = /^([0-9]{2})([a-z0-9])([0-9]{2})$/i.exec(rawExpiry);
  if (match?.[0]) {
    // eslint-disable-next-line no-unused-vars
    const [_, year, month, day] = match;
    const monthNum = singleDigitMonthMap[month.toUpperCase()] || parseInt(month - 1, 10);
    return {
      expiryType: 'weekly',
      expiryDate: new Date(+`20${year}`, monthNum, +day + 1),
    };
  }
  const year = rawExpiry.slice(0, 2);
  return {
    expiryType: 'monthly',
    expiryDate: getLastThursdayOfMonth(+`20${year}`, monthMap[rawExpiry]),
  };
});


export const getLastThursdayOfMonth = (year, month) => {
  const lastDay = new Date(year, month + 1, 0);
  const lastThursday = new Date(year, month, lastDay.getDate() - lastDay.getDay() + 4);
  return lastThursday.getDate();
};

export const getATMStrikeNumfromCur = (num, symbolObj) => {
  const { strikeDiff } = symbolObj;
  return Math.round(num / strikeDiff) * strikeDiff;
};

export const processSymbol = (symbol) => {
  const [_, index, rawExpiry, strikeNum, contractType] = optSymbolRegex.exec(symbol);
  return {
    index, rawExpiry, strikeNum, contractType,
  };
};

export const computeStrikeType = (strikeNum, current, contractType) => {
  const strikeDiff = strikeNum - current;
  if (strikeDiff > 25) {
    return contractType === 'PE' ? 'itm' : 'otm';
  } if (strikeDiff < -25) {
    return contractType === 'PE' ? 'otm' : 'itm';
  }
  return 'atm';
};

export const prepareSymbolList = (symbolObj, atm) => {
  const { prefix, strikeDiff, strikeExtreme, expiry } = symbolObj;
  const contractTypes = ['CE', 'PE'];
  const firstStrike = atm - strikeExtreme;
  const lastStrike = atm + strikeExtreme;
  const strikes = [];
  for (let i = firstStrike; i <= lastStrike; i += strikeDiff) {
    for (const contractType of contractTypes) {
      strikes.push(`${prefix}${expiry}${i}${contractType}`);
    }
  }
  return strikes;
};

