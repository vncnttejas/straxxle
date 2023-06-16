const _ = require('lodash');
const { app } = require('../server');
const { getTapeDiff } = require('../utils/ticker-tape');
const { Orders } = require('../models/Orders');
const {
  computeStrikeWisePnl,
  computeSummary,
  computeRawPosition,
  sortPositionList,
} = require('../utils/position');

const memoComputeRawPosition = _.memoize(computeRawPosition);
const memoComputeSummary = _.memoize(computeSummary);
const memoSortPositionList = _.memoize(sortPositionList);

const handler = async (req) => {
  let getAll = true;
  const { startTime, endTime } = req.query;

  setInterval(async () => {
    const tapeDiff = getTapeDiff(getAll);
    const updatedKeys = Object.keys(tapeDiff);
    const newUpdatesCount = updatedKeys.length;
    if (newUpdatesCount) {
      req.log.info({ newUpdatesCount }, 'Sending new records');
      (await app).io.emit('tick', tapeDiff);

      getAll = false;

      const orders = await Orders.find({
        createdAt: {
          $gte: new Date(+startTime),
          $lte: new Date(+endTime),
        },
      });

      const positions = memoComputeRawPosition(orders);
      const pnlPosition = computeStrikeWisePnl(positions);
      const sortedPosition = memoSortPositionList(pnlPosition);
      const summary = memoComputeSummary(sortedPosition);
      (await app).io.emit('position', {
        position: sortedPosition,
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
  url: '/trigger-ticker-socket',
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
