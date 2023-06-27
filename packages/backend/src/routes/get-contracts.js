const { getStoreData } = require('../utils/data-store');

const handler = async () => getStoreData('defaultSymbols');

module.exports = {
  method: 'GET',
  url: '/get-contracts',
  handler,
};
