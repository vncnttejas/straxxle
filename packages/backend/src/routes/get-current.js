const { fetchCurrent } = require('../utils/ticker-tape');

const handler = async () => {
  return await fetchCurrent();
};

module.exports = {
  method: 'GET',
  url: '/get-current',
  handler,
};
