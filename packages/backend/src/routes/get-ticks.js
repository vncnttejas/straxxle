const { app } = require('../server');
const { getTapeDiff } = require('../utils/ticker-tape');

const handler = async (req) => {
  let getAll = true;
  setInterval(async () => {
    const tapeDiff = getTapeDiff(getAll);
    const updatedKeys = Object.keys(tapeDiff);
    const newUpdatesCount = updatedKeys.length;
    if (newUpdatesCount) {
      getAll = false;
      req.log.info({ newUpdatesCount }, 'Sending new records');
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
