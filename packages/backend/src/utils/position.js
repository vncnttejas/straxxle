const { Orders } = require('../models/Orders');
const { orderStack } = require('../utils/order-stack');

const getStartnEndDate = (targetDate) => {
  const d = new Date(targetDate);
  d.setHours(0, 0, 0, 0);
  const startTime = new Date(d);
  d.setHours(23, 59, 59, 999);
  const endTime = new Date(d);
  return { startTime, endTime };
};

const computePosition = async ({ targetDate = new Date(), strikeDiff = -50 }) => {
  const { startTime, endTime } = getStartnEndDate(targetDate);
  const orderList = await Orders.find({
    createdAt: {
      '$gt': startTime,
      '$lt': endTime,
    },
  });
  const orders = [];
  for (let order of orderList) {
    orders.push(order.toJSON());
  }

  const orderDataList = [];
  let totalPl = 0;
  let totalCharges = 0;
  let totalTurnOver = 0;
  let maxTurnOver = 0;
  let dirTurnOver = 0;
  let totalStt = 0;
  let totalStamp = 0;
  let totalSebi = 0;
  let totalTransaction = 0;
  let totalGst = 0;
  orderStack.clearStack();
  for (let order of orders) {
    const orderSummary = orderStack.pushOrder(order, strikeDiff);
    const { pl, charges, turnOver, orderData, type } = orderSummary;
    totalPl += pl;
    totalStt += charges.stt;
    totalStamp += charges.stamp;
    totalSebi += charges.sebi;
    totalTransaction += charges.transaction;
    totalGst += charges.gst;
    totalCharges += charges.total;
    totalTurnOver += turnOver;
    dirTurnOver = type === 'buy' ? dirTurnOver + turnOver : 0;
    maxTurnOver = maxTurnOver >= dirTurnOver ? maxTurnOver : dirTurnOver;
    orderDataList.push({ ...orderData, type });
  }
  const totalBrokerage = orders.length * 20;
  return {
    orderDataList: orderDataList.reverse(),
    position: {
      orderCount: orders.length,
      netOpenPosition: orderStack.openPositions(),
      totalPl,
      totalStt,
      totalStamp,
      totalSebi,
      totalTransaction,
      totalGst,
      netPl: totalPl - totalBrokerage - totalCharges,
      plPercentage: 0,
      totalBrokerage,
      totalCharges,
      totalTurnOver,
      maxTurnOver,
    },
  };
}

module.exports = {
  computePosition,
}