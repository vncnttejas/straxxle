const { get, set, unset } = require('lodash');

const globalDataStore = {
  tape: {},
  subTape: {},
  ocContext: null,
  getAll: false,
  streamLive: false,
  fyersCred: {},
  defaultSymbols: {
    NIFTY: {
      shortName: 'NIFTY',
      prefix: 'NSE:NIFTY',
      symbol: 'NSE:NIFTY50-INDEX',
      strikeDiff: 50,
      strikeExtreme: 800,
      expiry: '23706',
      current: 0,
    },
    FINNIFTY: {
      shortName: 'FINNIFTY',
      prefix: 'NSE:FINNIFTY',
      symbol: 'NSE:FINNIFTY-INDEX',
      strikeDiff: 50,
      strikeExtreme: 800,
      expiry: '23704',
      current: 0,
    },
    BANKNIFTY: {
      shortName: 'BANKNIFTY',
      prefix: 'NSE:BANKNIFTY',
      symbol: 'NSE:NIFTYBANK-INDEX',
      strikeDiff: 100,
      strikeExtreme: 1600,
      expiry: '23706',
      current: 0,
    },
  },
  watchList: [],
};

const getDataFactory = (dataCore) => (key) => {
  switch (typeof key) {
    case 'string':
      return get(dataCore, key);
    case 'function':
      return key(dataCore);
    case 'undefined':
      return dataCore;
    default:
      throw new Error('Invalid param provided');
  }
};

// Main DataStore
const getStoreData = getDataFactory(globalDataStore);
const setStoreData = (field, update) => {
  set(globalDataStore, field, update);
};
const unsetDataStore = (field) => {
  unset(globalDataStore, field);
};

// Tape DataStore
const tape = getStoreData('tape');
const getTape = getDataFactory(tape);
const setTape = (field, update) => {
  set(tape, field, update);
};

// Subtape DataStore
const subTape = getStoreData('subTape');
const getSubTape = getDataFactory(subTape);
const setSubTape = (field, update) => {
  set(subTape, field, update);
};

module.exports = {
  getTape,
  setTape,
  getSubTape,
  setSubTape,
  unsetDataStore,
  setStoreData,
  getStoreData,
};
