const fyersApiV2 = require('fyers-api-v2');
const { memoize } = require('lodash');
const { quotes: Quotes } = require('fyers-api-v2');
const { produce } = require('immer');
const { set, throttle } = require('lodash');
const { TickSnapshot } = require('../models/Tick');
const { app } = require('../server');
const { getSymbolData, getATMStrikeNumfromCur, computeStrikeType } = require('./symbol-utils');

const currentExpiry = '23622';
const currentStock = 'NIFTY';
const symbolRegexp = '^NSE:(NIFTY|BANKNIFTY|FINNIFTY)([0-9]{2}[A-Z0-9]{3})([0-9]{3,6})([A-Z]{2})$';
const optSymbolRegex = new RegExp(symbolRegexp);

let tape = {};
const reqFields = [
  'symbol', 'index', 'strike', 'strikeNum', 'strikeType',
  'contractType', 'expiryType', 'expiryDate', 'lp', 'short_name',
];
let subTape = {};
const bkpArray = [];
const maxSize = 5;
let prevSnapshot = {};

const backupTapeSnapshot = async (snapshot) => {
  const response = await TickSnapshot.create({ snapshot });
  const insertId = response._id.toString();
  bkpArray.push(insertId);
  (await app).log.info({ insertId }, 'Inserting snapshot');
  if (bkpArray.length > maxSize) {
    const firstInsertId = bkpArray.shift();
    const logObj = { recordToRemove: firstInsertId, bkpArrayLength: bkpArray.length };
    (await app).log.info(logObj, 'Removing snapshot');
    await TickSnapshot.findByIdAndRemove(firstInsertId);
  }
};

const throttledSnapshotBkp = throttle(backupTapeSnapshot, 5000);

const setTape = (newTick) => {
  const symbol = Object.keys(newTick)[0];
  tape = produce(tape, (draft) => {
    draft[symbol] = newTick[symbol];
  });
  subTape = produce(subTape, (draft) => {
    reqFields.forEach((field) => {
      set(draft, `${symbol}.${field}`, newTick[symbol][field]);
    });
  });
  throttledSnapshotBkp(tape);
};

const getTape = (cb) => {
  if (cb && typeof cb !== 'function') {
    throw new Error('Expects empty param or a callback as param');
  }
  return cb ? cb(tape) : tape;
};

const fetchCurrent = async (stock = currentStock) => {
  const { symbol } = getSymbolData(stock);
  const quotes = new Quotes();
  const current = await quotes.setSymbol(symbol).getQuotes();
  return current.d[0].v.lp;
};

const processSymbol = (symbol) => {
  const [_, index, rawExpiry, strikeNum, contractType] = optSymbolRegex.exec(symbol);
  return {
    index, rawExpiry, strikeNum, contractType,
  };
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

const getTapeDiff = (getAll = false) => {
  if (getAll) {
    return subTape;
  }
  const diff = {};
  Object.values(subTape).forEach((strikeData) => {
    if (subTape[strikeData] !== prevSnapshot[strikeData]) {
      diff[strikeData] = subTape[strikeData];
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
  listenToUpdate,
};
