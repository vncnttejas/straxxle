const { keyBy } = require('lodash');
const { Orders } = require('../models/Orders');
const {
  computeStrikeWisePnl,
  computeSummary,
  computeRawPosition,
  sortPositionList,
} = require('../utils/position');
const { getApp } = require('../app');

const app = getApp();

const handler = async (req) => {
  const { startTime, endTime } = req.query;

  setInterval(async () => {
    const orders = await Orders.find({
      createdAt: {
        $gte: new Date(+startTime),
        $lte: new Date(+endTime),
      },
    });
    if (orders.length) {
      const positions = computeRawPosition(orders);
      const pnlPosition = computeStrikeWisePnl(positions);
      const sortedPosition = sortPositionList(pnlPosition);
      const summary = computeSummary(sortedPosition);
      req.log.info('Sending position update');
      app.io.emit('position', {
        position: keyBy(sortedPosition, 'symbol'),
        summary,
      });
    }
  }, 3000);
  return {
    success: true,
  };
};

module.exports = {
  method: 'GET',
  url: '/trigger-position-socket',
  handler,
  schema: {
    querystring: {
      type: 'object',
      properties: {
        startTime: {
          type: 'string',
          default: new Date().setHours(0, 0, 0, 0),
        },
        endTime: {
          type: 'string',
          default: new Date().setHours(23, 59, 59, 999),
        },
      },
    },
  },
};
