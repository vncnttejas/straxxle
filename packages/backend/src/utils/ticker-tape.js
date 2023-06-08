const fyersApiV2 = require('fyers-api-v2');

let tape = {};
let newUpdate = {};

const syncTickerData = (newTick) => {
  tape = { ...tape, ...newTick };
};

const getTickerData = (cb) => {
  if (cb && typeof cb !== 'function') {
    throw new Error('Expects empty param or a callback as param');
  }
  return cb ? cb(tape) : tape;
};

const resetTickerData = () => {
  tape = {};
};

const fetchCurrent = async (symbol = 'NSE:NIFTY50-INDEX') => {
  const quotes = new fyersApiV2.quotes();
  const current = await quotes.setSymbol(symbol).getQuotes();
  return current.d[0].v.lp;
};

const tapeSet = (newTick) => {
  newUpdate = { ...newUpdate, ...newTick };
};

const tapeGet = () => {
  const data = { ...newUpdate };
  newUpdate = {};
  return data;
};

module.exports = {
  getTickerData,
  syncTickerData,
  resetTickerData,
  fetchCurrent,
  tapeSet,
  tapeGet,
};
