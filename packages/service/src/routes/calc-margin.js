const { default: axios } = require('axios');
const { getStoreData } = require('../utils/data-store');
const { Orders } = require('../models/Orders');
const {
  memoComputeRawPosition, computeStrikeWisePnl, prepareOrderForMarginCalc,
} = require('../utils/position');

const handler = async () => {
  const orders = await Orders.find();

  const positions = memoComputeRawPosition(orders);
  const pnlPosition = computeStrikeWisePnl(positions);
  const data = prepareOrderForMarginCalc(pnlPosition);

  const token = getStoreData('fyersCred.token');
  if (!token) {
    return {
      message: 'token unavailable',
    };
  }
  const response = await axios.post('https://api.fyers.in/api/v2/span_margin', { data }, {
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

module.exports = {
  method: 'POST',
  url: '/calc-margin',
  handler,
  schema: {
    body: {
      type: 'object',
      properties: {
        includeOpen: {
          type: 'boolean',
          default: true,
        },
        orders: {
          type: 'array',
          items: {
            type: 'object',
            required: [
              'symbol', 'qty', 'productType', 'limitPrice',
            ],
            properties: {
              symbol: {
                type: 'string',
              },
              qty: {
                type: 'number',
              },
              limitPrice: {
                type: 'number',
              },
            },
          },
        },
      },
    },
  },
};
