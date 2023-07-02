const { setStoreData, unsetDataStore } = require('../utils/data-store');

const handler = async (req) => {
  const { symbol, reset } = req.body;

  if (reset) {
    unsetDataStore('ocContext');
    setStoreData('getAll', true);
    setStoreData('streamLive', false);
    return {
      success: true,
      message: 'unsubscribed from option chain watch',
    };
  }
  setStoreData('ocContext', symbol);
  setStoreData('getAll', true);
  setStoreData('streamLive', true);
  return {
    success: true,
    message: 'set the option chain context successfully',
  };
};

module.exports = {
  method: 'POST',
  url: '/set-oc-context',
  handler,
  schema: {
    body: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          minLength: 1,
        },
        reset: {
          type: 'boolean',
          default: false,
        },
      },
    },
  },
};
