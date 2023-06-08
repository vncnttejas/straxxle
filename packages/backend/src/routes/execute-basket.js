const { fetchCurrent } = require('../utils/ticker-tape');

const handler = async () => fetchCurrent();

module.exports = {
  method: 'POST',
  url: '/execute-basket/:id',
  handler,
};
