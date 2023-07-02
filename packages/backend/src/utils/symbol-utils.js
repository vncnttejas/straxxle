const { getStoreData } = require('./data-store');

const symbolRegexp = '^NSE:(NIFTY|BANKNIFTY|FINNIFTY)([0-9]{2}[A-Z0-9]{3})([0-9]{3,6})([A-Z]{2})$';
const optSymbolRegex = new RegExp(symbolRegexp);

const getSymbolData = (symbol) => {
  const savedSymbols = getStoreData('defaultSymbols');
  if (savedSymbols) {
    return savedSymbols[symbol];
  }
  throw new Error(`Invalid symbol provided: ${symbol}`);
};

const getATMStrikeNumfromCur = (num, symbolObj) => {
  const { strikeDiff } = symbolObj;
  return Math.round(num / strikeDiff) * strikeDiff;
};

const processSymbol = (symbol) => {
  const [_, index, rawExpiry, strikeNum, contractType] = optSymbolRegex.exec(symbol);
  return {
    index, rawExpiry, strikeNum, contractType,
  };
};

const computeStrikeType = (strikeNum, current, contractType) => {
  const strikeDiff = strikeNum - current;
  if (strikeDiff > 25) {
    return contractType === 'PE' ? 'itm' : 'otm';
  } if (strikeDiff < -25) {
    return contractType === 'PE' ? 'otm' : 'itm';
  }
  return 'atm';
};

const prepareSymbolList = (atm, stock, expiry) => {
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

module.exports = {
  symbolRegexp,
  optSymbolRegex,
  prepareSymbolList,
  processSymbol,
  computeStrikeType,
  getATMStrikeNumfromCur,
  getSymbolData,
};
