const fyersApiV2 = require('fyers-api-v2');
const { memoize } = require('lodash');

const { setTape, fetchCurrent } = require('./ticker-tape');

// eslint-disable-next-line prefer-regex-literals
const symbolRegexp = '^NSE:(NIFTY|BANKNIFTY|FINNIFTY)([0-9]{2}[A-Z0-9]{3})([0-9]{3,6})([A-Z]{2})$';
const optSymbolRegex = new RegExp(symbolRegexp);
const currentExpiry = '23622';
const currentStock = 'NIFTY';

const getSymbolData = (symbol) => {
  switch (symbol.toUpperCase()) {
    case 'NIFTY': {
      return {
        prefix: 'NSE:NIFTY',
        symbol: 'NSE:NIFTY50-INDEX',
        strikeDiff: 50,
        strikeExtreme: 600,
      };
    }
    case 'FINNIFTY': {
      return {
        prefix: 'NSE:FINNIFTY',
        symbol: 'NSE:FINNIFTY-INDEX',
        strikeDiff: 50,
        strikeExtreme: 600,
      };
    }
    case 'BANKNIFTY': {
      return {
        prefix: 'NSE:BANKNIFTY',
        symbol: 'NSE:NIFTYBANK-INDEX',
        strikeDiff: 100,
        strikeExtreme: 1200,
      };
    }
    default: {
      return {
        prefix: 'NSE:NIFTY',
        symbol: 'NSE:NIFTY50-INDEX',
        strikeDiff: 50,
        strikeExtreme: 600,
      };
    }
  }
};

const fetchStrikeList = (atm, stock = currentStock, expiry = currentExpiry) => {
  // https://community.fyers.in/post/symbol-format-6120f9828c095908c6387654
  const { prefix, strikeDiff, strikeExtreme } = getSymbolData(stock);
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

const getATMStrikeNumfromCur = (num) => {
  const strikeDiff = 50;
  return Math.round(num / strikeDiff) * strikeDiff;
};

const getLastThursdayOfMonth = (year, month) => {
  const lastDay = new Date(year, month + 1, 0);
  const lastThursday = new Date(year, month, lastDay.getDate() - lastDay.getDay() + 4);
  return lastThursday.getDate();
};

const monthMap = {
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

const singleDigitMonthMap = {
  O: 10,
  N: 11,
  D: 12,
};

const processExpiry = memoize((rawExpiry) => {
  const match = /^([0-9]{2})([a-z0-9])([0-9]{2})$/i.exec(rawExpiry);
  if (match[0]) {
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

const computeStrikeType = (strikeNum, current, contractType) => {
  const strikeDiff = strikeNum - current;
  if (strikeDiff > 25) {
    return contractType === 'PE' ? 'itm' : 'otm';
  } if (strikeDiff < -25) {
    return contractType === 'PE' ? 'otm' : 'itm';
  }
  return 'atm';
};

const processSymbol = (symbol) => {
  const [_, index, rawExpiry, strikeNum, contractType] = optSymbolRegex.exec(symbol);
  return {
    index, rawExpiry, strikeNum, contractType,
  };
};

const processTick = (tick, atm, current) => {
  const { symbol } = tick;
  const {
    index, rawExpiry, strikeNum, contractType,
  } = processSymbol(symbol);
  const { expiryType, expiryDate } = processExpiry(rawExpiry);
  const strikeDiffPts = contractType === 'PE' ? atm - strikeNum : strikeNum - atm;
  const strikeType = computeStrikeType(strikeNum, current, contractType);
  const strikeDiff = strikeDiffPts / 50;
  const strike = `${strikeNum}${contractType}`;
  return {
    [symbol]: {
      index,
      rawExpiry,
      strike,
      strikeNum,
      strikeDiffPts,
      strikeDiff,
      strikeType,
      contractType,
      expiryType,
      expiryDate,
      ...tick,
    },
  };
};

const listenToUpdate = async (cred) => {
  fyersApiV2.setAppId(cred.appId);
  fyersApiV2.setRedirectUrl(cred.redirect_uri);
  fyersApiV2.setAccessToken(cred.access_token);

  const current = await fetchCurrent(currentStock);
  const atm = getATMStrikeNumfromCur(current);
  const strikes = fetchStrikeList(atm);
  fyersApiV2.fyers_connect({
    symbol: strikes,
    dataType: 'symbolUpdate',
    token: cred.secret_key,
  }, async (data) => {
    const tickUpdate = JSON.parse(data);
    if (tickUpdate.d?.['7208']?.length) {
      const tick = tickUpdate.d['7208'][0].v;
      const processedTick = processTick(tick, atm, current);
      setTape(processedTick);
    }
  });
};

module.exports = {
  symbolRegexp,
  optSymbolRegex,
  currentStock,
  currentExpiry,
  listenToUpdate,
  computeStrikeType,
  fetchStrikeList,
  getATMStrikeNumfromCur,
  getSymbolData,
};
