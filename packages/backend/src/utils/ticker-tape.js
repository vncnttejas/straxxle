const { quotes: Quotes } = require('fyers-api-v2');
const { produce } = require('immer');
const _ = require('lodash');
const { TickSnapshot } = require('../models/Tick');
const { app } = require('../server');

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
    (await app).log.info({ firstInsertId, bkpArrayLength: bkpArray.length }, 'Removing snapshot');
    await TickSnapshot.findByIdAndRemove(firstInsertId);
  }
};

const throttledSnapshotBkp = _.throttle(backupTapeSnapshot, 5000);

const setTape = (newTick) => {
  const symbol = Object.keys(newTick)[0];
  tape = produce(tape, (draft) => {
    draft[symbol] = newTick[symbol];
  });
  subTape = produce(subTape, (draft) => {
    reqFields.forEach((field) => {
      _.set(draft, `${symbol}.${field}`, newTick[symbol][field]);
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

const resetTape = () => {
  tape = {};
};

const fetchCurrent = async (symbol = 'NSE:NIFTY50-INDEX') => {
  const quotes = new Quotes();
  const current = await quotes.setSymbol(symbol).getQuotes();
  return current.d[0].v.lp;
};

const getTapeDiff = () => {
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
  resetTape,
  fetchCurrent,
  getTapeDiff,
};
