const _ = require('lodash');
const { Orders } = require('../models/Orders');
const {
  computeStrikeWisePnl, memoComputeRawPosition, memoSortPositionList, memoComputeSummary,
} = require('../utils/position');

const handler = async (req) => {
  const { startTime, endTime } = req.query;
  const orders = await Orders
    .find({
      createdAt: {
        $gte: new Date(+startTime),
        $lte: new Date(+endTime),
      },
    });

  const positions = memoComputeRawPosition(orders);
  const pnlPosition = computeStrikeWisePnl(positions);
  const sortedPosition = memoSortPositionList(pnlPosition);
  const summary = memoComputeSummary(sortedPosition);

  return {
    live: true,
    position: _.keyBy(sortedPosition, 'symbol'),
    summary,
  };
};

module.exports = {
  method: 'GET',
  url: '/position',
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
