const { get, set, unset } = require('lodash');

const globalDataStore = {
  defaultSymbols: {
    NIFTY: {
      shortName: 'NIFTY',
      prefix: 'NSE:NIFTY',
      symbol: 'NSE:NIFTY50-INDEX',
      strikeDiff: 50,
      strikeExtreme: 600,
      expiries: [{
        title: '23rd June',
        slug: '23JUN',
        type: 'monthly',
      }],
    },
    FINNIFTY: {
      shortName: 'FINNIFTY',
      prefix: 'NSE:FINNIFTY',
      symbol: 'NSE:FINNIFTY-INDEX',
      strikeDiff: 50,
      strikeExtreme: 600,
      expiries: [{
        title: '23rd June',
        slug: '23JUN',
        type: 'monthly',
      }],
    },
    BANKNIFTY: {
      shortName: 'BANKNIFTY',
      prefix: 'NSE:BANKNIFTY',
      symbol: 'NSE:NIFTYBANK-INDEX',
      strikeDiff: 100,
      strikeExtreme: 1200,
      expiries: [{
        title: '23rd June',
        slug: '23JUN',
        type: 'monthly',
      }],
    },
  },
  watchList: {
    defaultWatchSymbols: [
      'NSE:NIFTY50-INDEX',
      'NSE:FINNIFTY-INDEX',
      'NSE:NIFTYBANK-INDEX',
    ],
    optionChainSymbols: [],
    positionWatchSymbols: [],
  },
};

const setDataStore = (field, update) => {
  set(globalDataStore, field, update);
};

const unsetDataStore = (field) => {
  unset(globalDataStore, field);
};

const getStoreData = (key) => (key ? get(globalDataStore, key) : globalDataStore);

module.exports = {
  unsetDataStore,
  setDataStore,
  getStoreData,
};
