const _ = require('lodash');
const { produce } = require('immer');
const { getTape } = require('./ticker-tape');
const { appConstants: { lotSize } } = require('../config');

const monthMap = {
  0: 'Jan',
  1: 'Feb',
  2: 'Mar',
  3: 'Apr',
  4: 'May',
  5: 'Jun',
  6: 'Jul',
  7: 'Aug',
  8: 'Sep',
  9: 'Oct',
  10: 'Nov',
  11: 'Dec',
};

const addSup = (num) => {
  const val = (num - 1) % 10;
  let sup;
  if (val === 1) sup = 'st';
  if (val === 2) sup = 'nd';
  if (val === 3) sup = 'rd';
  return `${num - 1}${sup || 'th'}`;
};

// Compute Fees - https://zerodha.com/charges/#tab-equities
const computeFees = (orderVal) => {
  const unsingedOrderVal = Math.abs(orderVal);
  const brokerage = 20;
  const stt = (0.125 / 100) * unsingedOrderVal;
  const txnCharges = (0.05 / 100) * unsingedOrderVal;
  const gst = (18 / 100) * (brokerage + stt);
  // 1_00_00_000 = 1 crore
  const sebi = (10 / 1_00_00_000) * unsingedOrderVal;
  const stamp = (0.003 / 100) * unsingedOrderVal;
  const totalFees = brokerage + stt + txnCharges + gst + sebi + stamp;
  const response = {
    brokerage, stt, txnCharges, gst, sebi, stamp, totalFees,
  };
  Object.keys(response).forEach((key) => {
    response[key] = +response[key].toFixed(2);
  });
  return response;
};

const sortPositionList = (positions) => {
  const res = _(positions)
    .values()
    .sortBy(['tt'])
    .groupBy(({ posQty }) => posQty === 0)
    .value();
  // Holds all open positions
  const open = res.false || [];
  // Holds all closed positions
  const closed = res.true || [];
  const openPositions = _.sortBy(open, ({ symbol }) => symbol);
  // Put all open positions in the start and closed after
  return [...openPositions, ...closed];
};

const defaultExitFees = {
  brokerage: 0,
  stt: 0,
  txnCharges: 0,
  gst: 0,
  sebi: 0,
  stamp: 0,
  totalFees: 0,
};

// Compute PnL for each position
const computeStrikeWisePnl = (positions) => produce(Object.values(positions), (draft) => {
  draft.forEach((position) => {
    const {
      posQty, posAvg, posVal, symbol,
    } = position;
    const strike = getTape((tape) => tape[symbol]);
    const lp = strike?.lp || 0;
    const pnl = posQty ? (lp - posAvg) * posQty : 0 - posVal;
    position.lp = lp;
    position.pnl = +pnl.toFixed(2);
    position.posQty = posQty / lotSize;
    // The following line is required because when loading the app for the first time
    // generally strike may be empty until it's fetched
    const curPosVal = posQty * (strike?.lp || 0);
    position.exitFees = posQty ? computeFees(curPosVal) : defaultExitFees;
  });
});

// Compute Summary
const computeSummary = (pnlPosition) => produce(pnlPosition, (draft) => {
  const acc = {};
  if (!pnlPosition.length) {
    return {};
  }
  draft.forEach((cur) => {
    const accPnl = acc.pnl || 0;
    const accMtm = acc.mtm || 0;
    const isActive = cur.posQty !== 0;
    // `pnl` only computed for CLOSED positions
    const pnl = isActive ? accPnl : accPnl + cur.pnl;
    // `mtm` only computed for OPEN positions
    const mtm = isActive ? accMtm + cur.pnl : accMtm;
    const totalFees = cur.posFees.totalFees + (acc.fees?.totalFees || 0);
    const exitTotalFees = cur.exitFees.totalFees + (acc.exitFees?.exitTotalFees || 0);
    const activeOrders = acc.activeOrderCount || 0;
    acc.pnl = pnl;
    acc.mtm = mtm;
    acc.total = pnl + mtm - totalFees;
    acc.exitTotal = pnl + mtm - totalFees - exitTotalFees;
    acc.orderCount = cur.posOrderList.length + (acc.orderCount || 0);
    acc.activeOrderCount = isActive ? activeOrders + 1 : activeOrders;
    acc.exitFees = {
      brokerage: cur.exitFees.brokerage + (acc.exitFees?.brokerage || 0),
      stt: cur.exitFees.stt + (acc.exitFees?.stt || 0),
      txnCharges: cur.exitFees.txnCharges + (acc.exitFees?.txnCharges || 0),
      gst: cur.exitFees.gst + (acc.exitFees?.gst || 0),
      sebi: cur.exitFees.sebi + (acc.exitFees?.sebi || 0),
      stamp: cur.exitFees.stamp + (acc.exitFees?.stamp || 0),
      exitTotalFees,
    };
    acc.fees = {
      brokerage: cur.posFees.brokerage + (acc.fees?.brokerage || 0),
      stt: cur.posFees.stt + (acc.fees?.stt || 0),
      txnCharges: cur.posFees.txnCharges + (acc.fees?.txnCharges || 0),
      gst: cur.posFees.gst + (acc.fees?.gst || 0),
      sebi: cur.posFees.sebi + (acc.fees?.sebi || 0),
      stamp: cur.posFees.stamp + (acc.fees?.stamp || 0),
      totalFees,
    };
  });
  Object.keys(acc.fees).forEach((key) => {
    acc.fees[key] = +acc.fees[key].toFixed(2);
  });
  return acc;
});

const computeRawPosition = (orders) => {
  const finalPos = {};
  let reset = false;
  orders.forEach((order) => {
    const {
      symbol, strike, qty: orderQty, txnPrice, tt, index, expiryDate,
    } = order.toObject();
    const orderVal = orderQty * txnPrice;
    const fees = computeFees(orderVal);
    const orderDetails = {
      symbol, strike, orderQty, txnPrice, tt, fees,
    };

    if (!finalPos[symbol]?.symbol) {
      const exp = new Date(expiryDate);
      _.set(finalPos, `${symbol}.symbol`, symbol);
      finalPos[symbol].id = symbol;
      finalPos[symbol].posFees = fees;
      finalPos[symbol].strike = strike;
      finalPos[symbol].expiry = `${index} ${addSup(exp.getDate())} ${monthMap[exp.getMonth()]}`;
      finalPos[symbol].posQty = orderQty;
      finalPos[symbol].posAvg = txnPrice;
      finalPos[symbol].posVal = orderVal;
      finalPos[symbol].posOrderList = [orderDetails];
    } else {
      // Compute the position Qty, Value and Average
      const {
        posQty, posVal, posAvg, posFees,
      } = finalPos[symbol];
      const cumOpenQty = posQty + orderQty;
      const cumVal = posVal + orderVal;
      const cumOpenVal = reset ? orderVal : (finalPos[symbol].cumOpenVal || 0) + orderVal;
      // Compute the average of cost
      let cumAvg = 0;
      if (Math.sign(posVal) === Math.sign(orderVal)) {
        cumAvg = cumOpenVal / cumOpenQty;
      } else if (Math.abs(posQty) > Math.abs(orderQty)) {
        cumAvg = posAvg;
      } else if (Math.abs(posQty) < Math.abs(orderQty)) {
        cumAvg = txnPrice;
      }

      // Position information
      finalPos[symbol].posQty = cumOpenQty;
      finalPos[symbol].posAvg = cumAvg;
      finalPos[symbol].posVal = cumVal;
      finalPos[symbol].cumOpenVal = cumOpenVal;
      finalPos[symbol].posOrderList.push(orderDetails);

      // Position fees
      finalPos[symbol].posFees = {
        brokerage: posFees.brokerage + fees.brokerage,
        stt: posFees.stt + fees.stt,
        txnCharges: posFees.txnCharges + fees.txnCharges,
        gst: posFees.gst + fees.gst,
        sebi: posFees.sebi + fees.sebi,
        stamp: posFees.stamp + fees.stamp,
        totalFees: posFees.totalFees + fees.totalFees,
      };
      reset = !cumOpenQty;
    }
  });
  return finalPos;
};

module.exports = {
  computeRawPosition,
  computeSummary,
  sortPositionList,
  computeStrikeWisePnl,
};
