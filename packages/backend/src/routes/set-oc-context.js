const { setDataStore, getStoreData } = require('../utils/data-store');
const { prepareSymbolList, getATMStrikeNumfromCur } = require('../utils/symbol-utils');
const { getTape } = require('../utils/ticker-tape');

const handler = async (req) => {
  const { expiry, symbol } = req.body;
  const symbolObj = getStoreData(`defaultSymbols.${symbol}`);
  const stockData = getTape((tape) => tape[symbolObj.symbol]);
  const atm = getATMStrikeNumfromCur(stockData.lp);
  const optionChainSymbols = prepareSymbolList(atm, symbol, expiry);
  setDataStore('watchList.optionChainSymbols', optionChainSymbols);
  return {
    success: true,
  };
};

module.exports = {
  method: 'POST',
  url: '/set-oc-context',
  handler,
  schema: {
    body: {
      type: 'object',
      properties: {
        expiry: {
          type: 'string',
          minLength: 1,
        },
        symbol: {
          type: 'string',
          minLength: 1,
        },
      },
    },
  },
};
