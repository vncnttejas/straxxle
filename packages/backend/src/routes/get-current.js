const { fetchCurrent } = require('../utils/ticker-tape');

const handler = async (req) => {
  const { symbol } = req.query;
  return fetchCurrent(symbol);
};

module.exports = {
  method: 'GET',
  url: '/get-current',
  handler,
};
