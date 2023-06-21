const getSymbolData = (symbol) => {
  switch (symbol.toUpperCase()) {
    case 'NIFTY': {
      return {
        prefix: 'NSE:NIFTY',
        symbol: 'NSE:NIFTY50-INDEX',
        strikeDiff: 50,
        strikeExtreme: 600,
      };
    }
    case 'FINNIFTY': {
      return {
        prefix: 'NSE:FINNIFTY',
        symbol: 'NSE:FINNIFTY-INDEX',
        strikeDiff: 50,
        strikeExtreme: 600,
      };
    }
    case 'BANKNIFTY': {
      return {
        prefix: 'NSE:BANKNIFTY',
        symbol: 'NSE:NIFTYBANK-INDEX',
        strikeDiff: 100,
        strikeExtreme: 1200,
      };
    }
    default: {
      return {
        prefix: 'NSE:NIFTY',
        symbol: 'NSE:NIFTY50-INDEX',
        strikeDiff: 50,
        strikeExtreme: 600,
      };
    }
  }
};

const getATMStrikeNumfromCur = (num) => {
  const strikeDiff = 50;
  return Math.round(num / strikeDiff) * strikeDiff;
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

module.exports = {
  computeStrikeType,
  getATMStrikeNumfromCur,
  getSymbolData,
};
