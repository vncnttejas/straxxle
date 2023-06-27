const { keyBy, memoize } = require('lodash');
const { Orders } = require('../models/Orders');
const {
  computeStrikeWisePnl,
  computeSummary,
  computeRawPosition,
  sortPositionList,
} = require('../utils/position');
const { getApp } = require('../app');

const app = getApp();
const memoComputeRawPosition = memoize(computeRawPosition);
const memoSortPositionList = memoize(sortPositionList);

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
      const positions = memoComputeRawPosition(orders);
      const pnlPosition = computeStrikeWisePnl(positions);
      const sortedPosition = memoSortPositionList(pnlPosition);
      const summary = computeSummary(sortedPosition);
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
