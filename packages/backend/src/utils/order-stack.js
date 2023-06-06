const getStrikeByDiff = (strikes, strikeDiff, contractType) => {
  const strikeArray = Object.values(strikes);
  return strikeArray.find(strike => strike.strikeDiff === strikeDiff && strike.contract === contractType);
};

const p2z = (str) => String(str).padStart(2, 0);

const enrichStrikes = (order, strikeDiff, contractType) => {
  const d = new Date(order.createdAt);
  const time = `${p2z(d.getHours())}:${p2z(d.getMinutes())}:${p2z(d.getSeconds())}`;
  const strikeData = getStrikeByDiff(order.strikeSnapshot, strikeDiff, contractType);
  const enrichedOrder = {
    ...order,
    ...strikeData,
    id: order._id.toString(),
    time
  };
  delete enrichedOrder.strikeSnapshot;
  delete enrichedOrder._id;
  return enrichedOrder;
};

const enrichSummary = (order) => {
  const charges = {};

  if (order.type === 'sell') {
    charges.stt = order.turnOver * 0.05 / 100;
  }
  if (order.type === 'buy') {
    charges.stamp = order.turnOver * 0.003 / 100;
  }

  charges.sebi = 10 + 10 * 28 / 100;
  charges.transaction = order.turnOver * 0.053 / 100;
  charges.gst = (20 + charges.sebi + charges.transaction) * 18 / 100;

  charges.total = Object.values(charges).reduce((p, c) => p + c, 0);
  return { ...order, charges };
};

class Stack {
  constructor() {
    this._data = [];
    this.top = undefined;
  }

  push(item) {
    this._data.push(item);
    this.top = this._data[this._data.length - 1];
  }

  pop() {
    if (!this._data.length) {
      throw Error('Stack empty');
    }
    this._data.pop();
    if (this._data.length === 1) {
      this.top = undefined;
    }
    this.top = this._data[this._data.length - 1];
  }

  length() {
    return this._data.length;
  }

  clearStack() {
    this._data = [];
    this.top = undefined;
  }
}

class OrderStack extends Stack {
  constructor() {
    super();
  }

  pushOrder(order, strikeDiff) {
    if (this.top === undefined) {
      const contractType = order.direction === 'up' ? 'CE' : 'PE'
      const enrichedOrder = enrichStrikes(order, strikeDiff, contractType);
      this.push(enrichedOrder);
      const calc = {
        pl: 0,
        turnOver: enrichedOrder.ask * 50,
        type: 'buy',
        orderData: enrichedOrder
      };
      return enrichSummary(calc);
    }
    // top = 'CE'&'BUY' data = 'CE'&'BUY'
    if (this.top.direction === 'up' && order.direction === 'up') {
      const enrichedOrder = enrichStrikes(order, strikeDiff, 'CE');
      this.push(enrichedOrder);
      const calc = {
        pl: 0,
        turnOver: enrichedOrder.ask * 50,
        type: 'buy',
        orderData: enrichedOrder
      };
      return enrichSummary(calc);
    }
    // top = 'CE'&'BUY' data = 'CE'&'SELL'
    if (this.top.direction === 'up' && order.direction === 'down') {
      const sellableOrder = enrichStrikes(order, this.top.strikeDiff, 'CE');
      const calc = {
        pl: (sellableOrder.ask - this.top.bid) * 50,
        turnOver: sellableOrder.ask * 50,
        type: 'sell',
        orderData: sellableOrder,
      };
      this.pop();
      return enrichSummary(calc);
    }
    // top = 'PE'&'BUY' data = 'CE'&'BUY'
    if (this.top.direction === 'down' && order.direction === 'up') {
      const sellableOrder = enrichStrikes(order, this.top.strikeDiff, 'PE');
      const calc = {
        pl: (sellableOrder.ask - this.top.bid) * 50,
        turnOver: sellableOrder.ask * 50,
        type: 'sell',
        orderData: sellableOrder,
      }
      this.pop();
      return enrichSummary(calc);
    }
    // top = 'PE'&'BUY' data = 'PE'&'BUY'
    if (this.top.direction === 'down' && order.direction === 'down') {
      const enrichedOrder = enrichStrikes(order, strikeDiff, 'PE');
      this.push(enrichedOrder);
      const calc = {
        pl: 0,
        turnOver: enrichedOrder.ask * 50,
        charges: 0,
        type: 'buy',
        orderData: enrichedOrder,
      };
      return enrichSummary(calc);
    }
  }

  openPositions() {
    return {
      openPos: this.length(),
      direction: this.top?.direction || 0,
    };
  }
}

const orderStack = new OrderStack();

module.exports = {
  orderStack,
  enrichStrikes,
};

