const { app } = require('../server');
const { tapeGet } = require('../utils/ticker-tape');

const handler = async () => {
  setInterval(async () => {
    const tape = tapeGet();
    if (Object.keys(tape).length) {
      (await app).io.emit('tick', tape);
    }
  }, 5000);
  // setting this to more than 1 sec, doesn't work for some reason
  return {
    success: true,
  };
}

module.exports = {
  method: 'GET',
  url: '/trigger-ticker-socket',
  handler,
};
