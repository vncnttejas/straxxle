const { Orders } = require('../models/Orders');

const handler = async (req) => {
  const { startTime, endTime } = req.query;
  return Orders.find({
    createdAt: {
      $gte: new Date(+startTime),
      $lte: new Date(+endTime),
    },
  });
};

module.exports = {
  method: 'GET',
  url: '/orders',
  handler,
  schema: {
    querystring: {
      type: 'object',
      properties: {
        startTime: {
          type: 'string',
          pattern: '^[0-9]{13}$',
        },
        endTime: {
          type: 'string',
        },
      }
    },
  }
};
