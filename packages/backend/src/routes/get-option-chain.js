const { getTickerData } = require('../utils/ticker-tape');

const handler = async () => getTickerData();

module.exports = {
  method: 'GET',
  url: '/option-chain',
  handler,
};
