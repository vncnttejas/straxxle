const { fetchCurrent } = require('../utils/ticker-tape');

const handler = async () => fetchCurrent();

module.exports = {
  method: 'GET',
  url: '/get-current',
  handler,
};
