// eslint-disable-next-line import/no-extraneous-dependencies
const { Forbidden } = require('http-errors');
const { getStoreData } = require('../utils/data-store');

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
