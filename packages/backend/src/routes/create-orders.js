const { compact, flatten } = require('lodash');
const { Orders } = require('../models/Orders');
const { Tags } = require('../models/Tags');
const { getTickerData } = require('../utils/ticker-tape');

const handler = async (req) => {
  const orders = req.body;

  const allTags = compact(flatten([...orders.map(({ tags }) => tags)]));
  const foundTags = await Tags.find({ _id: { $in: allTags } });
  if (allTags.length && foundTags.length !== uniq(allTags).length) {
    throw Error(`Incorrect tags provided: ${incorrectTags.join(',')}`);
  }

  const enrichedOrders = orders.map((order) => {
    const strikeSnapshot = getTickerData((strikeData) => strikeData[order['symbol']]);
    if (!strikeSnapshot) {
      throw Error('Strike Not Found');
    }
    return {
      ...order,
      strike: strikeSnapshot.strike,
      txnPrice: strikeSnapshot.ask,
      contractType: strikeSnapshot.contractType,
      tt: strikeSnapshot.tt,
      exchange: strikeSnapshot.exchange,
      expiryDate: strikeSnapshot.expiryDate,
      expiryType: strikeSnapshot.expiryType,
      index: strikeSnapshot.index,
    };
  });

  await Orders.insertMany(enrichedOrders);

  return {
    success: true,
  };
};

module.exports = {
  method: 'POST',
  url: '/orders',
  handler,
  schema: {
    body: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            pattern: '^(NIFTY|BANKNIFTY|FINNIFTY)[0-9]{2}[A-Z0-9]{3}[0-9]{4,6}[A-Z]{2}$',
          },
          qty: {
            type: 'number',
          },
          tags: {
            type: 'array',
            uniqueItems: true,
            items: {
              type: 'string',
            },
          },
        },
        required: ['symbol', 'qty'],
      },
    },
  }
};
