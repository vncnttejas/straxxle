const _ = require('lodash');
const { Orders } = require('../models/Orders');

const monthMap = {
  0: 'JAN',
  1: 'FEB',
  2: 'MAR',
  3: 'APR',
  4: 'MAY',
  5: 'JUN',
  6: 'JUL',
  7: 'AUG',
  8: 'SEP',
  9: 'OCT',
  10: 'NOV',
  11: 'DEC',
};

const addSup = (num) => {
  const val = (num - 1) % 10;
  let sup;
  if (val === 1) sup = 'st';
  if (val === 2) sup = 'nd';
  if (val === 3) sup = 'rd';
  return `${num - 1}${sup || 'th'}`;
};

const computePosition = (orders) => {
  const enrichedPosition = orders.reduce((position, order) => {
    const {
      symbol, strike, qty: orderQty, txnPrice, tt, index, expiryDate,
    } = order.toJSON();
    const orderVal = orderQty * txnPrice;

    // Compute Fees - https://zerodha.com/charges/#tab-equities
    const brokerage = 20;
    const stt = 0.125 / 100 * orderVal;
    const txnCharges = 0.05 / 100 * orderVal;
    const gst = 18 / 100 * (brokerage + stt);
    const sebi = 10 / 1_00_00_000 * orderVal;
    const stamp = 0.003 / 100 * orderVal;
    const totalFees = brokerage + stt + txnCharges + gst + sebi + stamp;
    const fees = {
      brokerage, stt, txnCharges, gst, sebi, stamp, totalFees,
    };

    const orderDetails = {
      symbol, strike, orderQty, txnPrice, tt, fees,
    };

    if (position[symbol]?.symbol) {
      // Compute the position Qty, Value and Average
      const {
        posQty, posVal, posAvg, posOrderList, posFees,
      } = position[symbol];
      const cumQty = posQty + orderQty;
      const cumVal = posVal + orderVal;

      let cumAvg = 0;
      if (Math.sign(posVal) === Math.sign(orderVal)) {
        cumAvg = cumVal / cumQty;
      } else if (Math.abs(posQty) > Math.abs(orderQty)) {
        cumAvg = posAvg;
      } else if (Math.abs(posQty) < Math.abs(orderQty)) {
        cumAvg = txnPrice;
      } else if (cumQty === 0) {
        cumAvg = 0;
      }

      position[symbol] = {
        ...position[symbol],
        posFees: {
          brokerage: posFees.brokerage + fees.brokerage,
          stt: posFees.stt + fees.stt,
          txnCharges: posFees.txnCharges + fees.txnCharges,
          gst: posFees.gst + fees.gst,
          sebi: posFees.sebi + fees.sebi,
          stamp: posFees.stamp + fees.stamp,
          totalFees: posFees.totalFees + fees.totalFees,
        },
        posQty: cumQty,
        posAvg: cumAvg,
        posVal: cumVal,
        posOrderList: [...posOrderList, orderDetails],
      };
    } else {
      const exp = new Date(expiryDate);
      const expiry = `${index} ${addSup(exp.getDate())} ${monthMap[exp.getMonth()]}`;
      position[symbol] = {
        posFees: fees,
        strike,
        symbol,
        expiry,
        posQty: orderQty,
        posAvg: txnPrice,
        posVal: orderVal,
        posOrderList: [orderDetails],
      };
    }
    return position;
  }, {});

  const res = _(enrichedPosition).values().sortBy(['tt']).groupBy(({ posQty }) => posQty === 0)
    .value();
  const open = res.false || [];
  const closed = res.true || [];
  const openPositions = _.sortBy(open, ({ symbol }) => symbol);
  return [...openPositions, ...closed];
};

const handler = async (req) => {
  const { startTime, endTime } = req.query;
  const orders = await Orders
    .find({
      createdAt: {
        $gte: new Date(+startTime),
        $lte: new Date(+endTime),
      },
    });

  const position = computePosition(orders);
  return _.keyBy(position, 'symbol');
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
