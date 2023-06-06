const { getStoreData } = require('../utils/data-store');
const { Forbidden } = require('http-errors');

const handler = async () => {
  const accessToken = getStoreData('accessToken');
  if (accessToken) {
    return {
      accessToken,
    };
  }
  throw Forbidden('Token unavailable');
};

module.exports = {
  method: 'GET',
  url: '/auth',
  handler,
};
