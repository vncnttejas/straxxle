const { keyBy } = require('lodash');
const { getTapeDiff } = require('../utils/ticker-tape');
const { getApp } = require('../app');
const { getStoreData, setStoreData } = require('../utils/data-store');

const app = getApp();

const handler = async (req) => {
  setInterval(async () => {
    const shouldStream = getStoreData('streamLive');
    if (shouldStream) {
      const getAll = getStoreData('getAll');
      let tapeDiff = getTapeDiff(getAll);
      const ocContext = getStoreData('ocContext');
      if (ocContext) {
        const filteredDiff = Object.values(tapeDiff).filter(({ index }) => index === ocContext);
        tapeDiff = keyBy(filteredDiff, 'symbol');
      }
      const updatedKeys = Object.keys(tapeDiff);
      const newUpdatesCount = updatedKeys.length;
      if (newUpdatesCount) {
        req.log.info({ newUpdatesCount }, 'Sending new records');
        app.io.emit('tick', tapeDiff);
        setStoreData('getAll', false);
      }
    }
  }, 3000);
  return {
    success: true,
  };
};

module.exports = {
  method: 'GET',
  url: '/trigger-ticker-socket',
  handler,
};
