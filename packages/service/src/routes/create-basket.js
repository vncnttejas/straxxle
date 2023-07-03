const {
  flatten, difference, uniq, compact,
} = require('lodash');
const { Baskets } = require('../models/Baskets');
const { Tags } = require('../models/Tags');
const { getTape } = require('../utils/ticker-tape');
const { symbolRegexp } = require('../utils/symbol-utils');

const handler = async (req) => {
  // Get all tags from basket and orders and flatten them
  const allTags = compact(flatten([...req.body.orders.map(({ tags }) => tags), ...req.body.tags]));

  // Check if all tags exist
  const foundTags = await Tags.find({ _id: { $in: allTags } });
  if (allTags.length && foundTags.length !== uniq(allTags).length) {
    const correctTags = foundTags.map((tagModel) => tagModel.toJSON()._id.toString());
    const incorrectTags = difference(allTags, correctTags);
    throw Error(`Incorrect tags provided: ${incorrectTags.join(',')}`);
  }
  const tags = foundTags.map((tagModel) => tagModel.toJSON()._id.toString());

  // Prepare all orders for saving to DB
  req.body.orders.forEach((order) => {
    const strikeSnapshot = getTape((strikeData) => strikeData[order.symbol]);
    if (!strikeSnapshot) {
      throw Error('Strike Not Found');
    }
    order.buyPrice = strikeSnapshot.ask;
    order.strikeType = strikeSnapshot.strikeType;
    order.contractType = strikeSnapshot.contractType;
    order.tt = strikeSnapshot.tt;
    order.exchange = strikeSnapshot.exchange;
    order.tags = tags;
  });

  const basket = await Baskets.create(req.body);
  return basket.toObject();
};

module.exports = {
  method: 'POST',
  url: '/basket',
  handler,
  schema: {
    body: {
      type: 'object',
      required: ['orders'],
      properties: {
        name: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        tags: {
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string',
          },
        },
        orders: {
          type: 'array',
          uniqueItemProperties: ['symbol'],
          items: {
            type: 'object',
            required: ['symbol', 'qty'],
            properties: {
              symbol: {
                type: 'string',
                pattern: symbolRegexp,
              },
              qty: {
                type: 'number',
                minimum: 1,
              },
              tags: {
                type: 'array',
                uniqueItems: true,
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  },
};
