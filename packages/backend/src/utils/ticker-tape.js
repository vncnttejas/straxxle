const { quotes: Quotes } = require('fyers-api-v2');
const { produce } = require('immer');
const { set, throttle } = require('lodash');
const { TickSnapshot } = require('../models/Tick');
const { app } = require('../server');
const { getSymbolData, currentStock } = require('./symbol-utils');

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

const getTapeDiff = (getAll = false) => {
  if (getAll) {
    return subTape;
  }
  const diff = {};
  for (const strikeData in subTape) {
    if (subTape[strikeData] !== prevSnapshot[strikeData]) {
      diff[strikeData] = subTape[strikeData];
    }
  }
  prevSnapshot = { ...subTape };
  return diff;
};

module.exports = {
  getTape,
  setTape,
  fetchCurrent,
  getTapeDiff,
};
