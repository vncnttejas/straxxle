const fyersApiV2 = require('fyers-api-v2');
const { chunk, flatten, pick } = require('lodash');
const {
  computeStrikeType, processSymbol, getATMStrikeNumfromCur, processExpiry,
} = require('./symbol-utils');
const {
  getStoreData, setSubTape, getSubTape, setTape, getTape,
} = require('./data-store');
const { getApp } = require('../app');

const { quotes: Quotes } = fyersApiV2;

const app = getApp();

const reqFields = [
  'symbol', 'index', 'strike', 'strikeNum', 'strikeType',
  'contractType', 'expiryType', 'expiryDate', 'lp', 'short_name',
];

let prevSnapshot = {};

const getSymbolData = (symbol) => {
  const savedSymbols = getStoreData('defaultSymbols');
  if (savedSymbols) {
    return savedSymbols[symbol];
  }
  throw new Error(`Invalid symbol provided: ${symbol}`);
};

const enrichStrikeData = (tick) => {
  const { symbol } = tick;
  const {
    index, rawExpiry, strikeNum, contractType,
  } = processSymbol(symbol);
  const symbolObj = getStoreData(`defaultSymbols.${index}`);
  const currentValue = symbolObj.current;
  const atm = getATMStrikeNumfromCur(currentValue, symbolObj);
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

const fetchCurrent = async (stock) => {
  const { symbol } = getSymbolData(stock);
  const quotes = new Quotes();
  const current = await quotes.setSymbol(symbol).getQuotes();
  return current.d[0].v.lp;
};

const flattenWatchList = (watchList) => flatten(Object.values(watchList));

const maxWatchItems = 50;
const triggerListen = () => {
  const watchListSymbols = flattenWatchList(getStoreData('watchList'));
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
        const strikeData = tickUpdate.d['7208'][0].v;
        const { symbol } = strikeData;
        const symbolData = enrichStrikeData(strikeData);
        setTape(symbol, symbolData);
        setSubTape(symbol, pick(symbolData, reqFields));
      }
    });
  });
};

const getTapeDiff = (getAll = false) => {
  const subTape = getSubTape();
  if (getAll) {
    return subTape;
  }
  const optionChainSymbols = getStoreData('watchList');
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
  getSymbolData,
  fetchCurrent,
  getTapeDiff,
  enrichStrikeData,
  triggerListen,
};
