const { app } = require('../server');
const { getTapeDiff } = require('../utils/ticker-tape');

const handler = async ({ log }) => {
  setInterval(async () => {
    const tapeDiff = getTapeDiff();
    const updatedKeys = Object.keys(tapeDiff);
    const newUpdatesCount = updatedKeys.length;
    log.info({ newUpdatesCount }, 'Sending new records');
    if (newUpdatesCount) {
      (await app).io.emit('tick', tapeDiff);
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
