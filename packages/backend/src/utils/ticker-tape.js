const fyersApiV2 = require('fyers-api-v2');
const {
  memoize, chunk, flatten, xor,
} = require('lodash');
const { produce } = require('immer');
const { set } = require('lodash');
const {
  getSymbolData, computeStrikeType, processSymbol, getATMStrikeNumfromCur,
} = require('./symbol-utils');
const { getStoreData } = require('./data-store');
const { getApp } = require('../app');

const { quotes: Quotes } = fyersApiV2;

const app = getApp();

const reqFields = [
  'symbol', 'index', 'strike', 'strikeNum', 'strikeType',
  'contractType', 'expiryType', 'expiryDate', 'lp', 'short_name',
];
let tape = {};
let subTape = {};
let prevSnapshot = {};

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

const getLastThursdayOfMonth = (year, month) => {
  const lastDay = new Date(year, month + 1, 0);
  const lastThursday = new Date(year, month, lastDay.getDate() - lastDay.getDay() + 4);
  return lastThursday.getDate();
};

const processExpiry = memoize((rawExpiry) => {
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

const enrichStrikeData = (tick) => {
  const { symbol } = tick;
  const {
    index, rawExpiry, strikeNum, contractType,
  } = processSymbol(symbol);
  const currentUnderlying = getStoreData(`defaultSymbols.${index}`).symbol;
  const currentValue = tape[currentUnderlying].lp;
  const atm = getATMStrikeNumfromCur(currentValue);
  const { expiryType, expiryDate } = processExpiry(rawExpiry);
  const strikeDiffPts = contractType === 'PE' ? atm - strikeNum : strikeNum - atm;
  const strikeType = computeStrikeType(strikeNum, currentValue, contractType);
  const strikeDiff = strikeDiffPts / 50;
  const strike = `${strikeNum}${contractType}`;
  return {
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
  };
};

const setTape = (newTick) => {
  const isOption = !!newTick.LTQ;
  const { symbol } = newTick;
  let data = newTick;
  if (isOption) {
    data = enrichStrikeData(newTick);
  }
  tape = produce(tape, (draft) => {
    set(draft, symbol, data);
    set(draft, `${symbol}.isOption`, isOption);
  });
  subTape = produce(subTape, (draft) => {
    set(draft, `${symbol}.isOption`, isOption);
    reqFields.forEach((field) => {
      set(draft, `${symbol}.${field}`, data[field]);
    });
  });
};

const getTape = (cb) => {
  if (cb && typeof cb !== 'function') {
    throw new Error('Expects empty param or a callback as param');
  }
  return cb ? cb(tape) : tape;
};

const fetchCurrent = async (stock) => {
  const { symbol } = getSymbolData(stock);
  const quotes = new Quotes();
  const current = await quotes.setSymbol(symbol).getQuotes();
  return current.d[0].v.lp;
};

const flattenWatchList = (watchList) => flatten(Object.values(watchList));

const maxWatchItems = 50;
const triggerListen = () => {
  let watchListSymbols = flattenWatchList(getStoreData('watchList'));
  app.log.info(watchListSymbols, 'Listening for symbol updates');
  const chunkedWatchLists = chunk(watchListSymbols, maxWatchItems);
  const token = getStoreData('fyersCred.secret_key');
  chunkedWatchLists.forEach((watchListChunk) => {
    const request = {
      symbol: watchListChunk,
      dataType: 'symbolUpdate',
      token,
    };
    fyersApiV2.fyers_connect(request, (data) => {
      const tickUpdate = JSON.parse(data);
      if (tickUpdate.d?.['7208']?.length) {
        setTape(tickUpdate.d['7208'][0].v);
      }
      const newWatchList = flattenWatchList(getStoreData('watchList'));
      const diff = xor(newWatchList, watchListSymbols);
      if (diff.length) {
        app.log.info(diff, 'Watchlist updated');
        watchListSymbols = newWatchList;
        setTimeout(() => {
          fyersApiV2.fyers_unsuscribe({
            symbol: watchListSymbols,
            dataType: 'symbolUpdate',
            token,
          });
        }, 1000);
        setTimeout(() => {
          triggerListen();
        }, 1100);
      }
    });
  });
};

const getTapeDiff = (getAll = false) => {
  if (getAll) {
    return subTape;
  }
  const { optionChainSymbols } = getStoreData('watchList');
  if (!optionChainSymbols?.length) {
    return [];
  }
  const diff = {};
  Object.keys(subTape).forEach((symbol) => {
    if (optionChainSymbols.includes(symbol) && subTape[symbol] !== prevSnapshot[symbol]) {
      diff[symbol] = subTape[symbol];
    }
  });
  prevSnapshot = { ...subTape };
  return diff;
};

module.exports = {
  getTape,
  setTape,
  fetchCurrent,
  getTapeDiff,
  enrichStrikeData,
  triggerListen,
};
