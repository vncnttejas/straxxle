const { getTapeDiff } = require('../utils/ticker-tape');
const { getApp } = require('../app');

const app = getApp();

const handler = async (req) => {
  let getAll = true;
  setInterval(async () => {
    const tapeDiff = getTapeDiff(getAll);
    const updatedKeys = Object.keys(tapeDiff);
    const newUpdatesCount = updatedKeys.length;
    if (newUpdatesCount) {
      req.log.info({ updatedKeys, newUpdatesCount }, 'Sending new records');
      app.io.emit('tick', tapeDiff);
      getAll = false;
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
