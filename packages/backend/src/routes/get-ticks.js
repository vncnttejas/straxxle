const { app } = require('../server');
const { getTapeDiff } = require('../utils/ticker-tape');

const handler = async ({ log }) => {
  setInterval(async () => {
    const tapeDiff = getTapeDiff();
    const updatedKeys = Object.keys(tapeDiff);
    const tapeDiffLength = updatedKeys.length;
    log.info({ tapeDiffLength }, 'Sending new records');
    if (tapeDiffLength) {
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
