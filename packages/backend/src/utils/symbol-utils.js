const fyersApiV2 = require('fyers-api-v2');
const { syncTickerData, resetTickerData, fetchCurrent, tapeSet } = require('./ticker-tape');
const { memoize } = require('lodash');

const fetchStrikeList = (atm, prefix = 'NSE:NIFTY', expiry = '23608', strikeExtreme = 600) => {
  // https://community.fyers.in/post/symbol-format-6120f9828c095908c6387654
  const fetchStrikeDiff = 50;
  const contractTypes = ['CE', 'PE'];
  const firstStrike = atm - strikeExtreme;
  const lastStrike = atm + strikeExtreme;
  const strikes = [];
  for (let i = firstStrike; i <= lastStrike; i = i + fetchStrikeDiff) {
    for (let contractType of contractTypes) {
      strikes.push(`${prefix}${expiry}${i}${contractType}`);
    }
  }
  return strikes;
};

const getPrefixFromSymbol = (symbol) => {
  if (symbol === 'NIFTY') {
    return 'NSE:NIFTY';
  }
}

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
    const monthNum = singleDigitMonthMap[month.toUpperCase()] || parseInt(month - 1);
    return {
      expiryType: 'weekly',
      expiryDate: new Date(+`20${year}`, monthNum, +day + 1),
    };
  }
  else {
    const year = rawExpiry.slice(0, 2);
    return {
      expiryType: 'monthly',
      expiryDate: getLastThursdayOfMonth(+`20${year}`, monthMap[rawExpiry]),
    };
  }
});

const computeStrikeType = (strikeNum, current, contractType) => {
  const strikeDiff = strikeNum - current;
  if (strikeDiff > 25) {
    return contractType === 'PE' ? 'itm' : 'otm';
  } else if (strikeDiff < -25) {
    return contractType === 'PE' ? 'otm' : 'itm';
  }
  return 'atm';
};

const processSymbol = (symbol) => {
  const regex = new RegExp("^(NIFTY|BANKNIFTY|FINNIFTY)([0-9]{2}[A-Z0-9]{3})([0-9]{3,6})([A-Z]{2})$");
  const [_, index, rawExpiry, strikeNum, contractType] = regex.exec(symbol);
  return { index, rawExpiry, strikeNum, contractType };
};

const processTick = (tick, atm, current) => {
  const { short_name: symbol, lp } = tick;
  const { index, rawExpiry, strikeNum, contractType } = processSymbol(symbol);
  const { expiryType, expiryDate } = processExpiry(rawExpiry);
  const strikeDiffPts = contractType === 'PE' ? atm - strikeNum : strikeNum - atm;
  const strikeType = computeStrikeType(strikeNum, current, contractType)
  const strikeDiff = strikeDiffPts / 50;
  const strike = `${strikeNum}${contractType}`;
  return {
    fullUpdate: {
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
        ...tick
      },
    },
    quoteUpdate: {
      [symbol]: {
        symbol,
        index,
        strike,
        strikeNum,
        strikeDiffPts,
        strikeDiff,
        strikeType,
        contractType,
        expiryType,
        expiryDate,
        lp,
      },
    }
  };
};

const listenToUpdate = async (cred) => {
  fyersApiV2.setAppId(cred.appId);
  fyersApiV2.setRedirectUrl(cred.redirect_uri);
  fyersApiV2.setAccessToken(cred.access_token);
  const current = await fetchCurrent();
  const atm = getATMStrikeNumfromCur(current);
  const strikes = fetchStrikeList(atm);
  const reqBody = {
    symbol: strikes,
    dataType: 'symbolUpdate',
    token: cred.secret_key,
  }
  fyersApiV2.fyers_connect(reqBody, async (data) => {
    const tickUpdate = JSON.parse(data);
    if (tickUpdate.d?.['7208']?.length) {
      const tick = tickUpdate.d['7208'][0].v;
      const { fullUpdate, quoteUpdate } = processTick(tick, atm, current);
      syncTickerData(fullUpdate);
      tapeSet(quoteUpdate);
    } else {
      resetTickerData();
    }
  });
};

module.exports = {
  listenToUpdate,
  computeStrikeType,
  fetchStrikeList,
  getATMStrikeNumfromCur,
  getPrefixFromSymbol,
};
