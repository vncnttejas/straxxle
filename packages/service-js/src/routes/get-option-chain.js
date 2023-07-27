const { getTape } = require('../utils/ticker-tape');

const handler = async () => getTape();

module.exports = {
  method: 'GET',
  url: '/option-chain',
  handler,
};
