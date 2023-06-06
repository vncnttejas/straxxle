const { fetchStrikeList, getATMStrikeNumfromCur, getPrefixFromSymbol } = require('../utils/symbol-utils');
const { fetchCurrent } = require('../utils/ticker-tape');

const handler = async (req) => {
  const { stock_symbol, expiry } = req.query;
  const current = await fetchCurrent(stock_symbol);
  const atmStrikeNum = getATMStrikeNumfromCur(current);
  const prefix = getPrefixFromSymbol(stock_symbol);
  return fetchStrikeList(atmStrikeNum, prefix, expiry);
};

module.exports = {
  method: 'GET',
  url: '/get-strikes',
  handler,
  schema: {
    querystring: {
      type: 'object',
      properties: {
        stock_symbol: {
          type: 'string',
          default: 'NSE:NIFTY50-INDEX',
        },
        expiry: {
          type: 'string',
        },
      },
    },
  },
};
