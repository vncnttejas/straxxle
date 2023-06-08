const { fetchCurrent } = require('../utils/ticker-tape');

const handler = async () => fetchCurrent();

module.exports = {
  method: 'PUT',
  url: '/tag-orders',
  handler,
};
