import { Injectable } from '@nestjs/common';
import _, { keyBy, set, values } from 'lodash';
import { OrdersService } from '../orders/orders.service';
import { PositionSummary } from './types/position-summary.type';
import { Order } from '../orders/entities/order.entity';
import { StrikewisePosition } from './types/strike-wise-position.type';
import { TapeService } from '../tape/tape.service';
import { PositionWithPnl } from './types/position-with-pnl.type';
import { PositionWithSummary } from './types';
import { CommonService } from '../common/common.service';
import { FilterOrderByTimeDto } from './dtos';
import { defaultEndTime, defaultStartTime } from '../orders/dtos/filter-order-by-time.dto';

@Injectable()
export class PositionsService {
  filterContext: FilterOrderByTimeDto = {
    startTime: defaultStartTime,
    endTime: defaultEndTime,
  };

  constructor(
    private commonService: CommonService,
    private tapeService: TapeService,
    private ordersService: OrdersService,
  ) {}

  getFilterContext() {
    return this.filterContext;
  }

  setFilterContext(filter: FilterOrderByTimeDto) {
    this.filterContext = filter;
  }

  private defaultExitFees = {
    brokerage: 0,
    stt: 0,
    txnCharges: 0,
    gst: 0,
    sebi: 0,
    stamp: 0,
    totalFees: 0,
  };

  computeRawPosition(orders: Order[]): StrikewisePosition {
    const finalPos = {} as StrikewisePosition;
    let reset = false;
    orders.forEach((order) => {
      const { symbol, strike, qty: orderQty, txnPrice, tt, indexSymbol, expiryDate } = order;
      const index = this.commonService.getIndexShortNameBySymbol(indexSymbol);
      const orderVal = orderQty * txnPrice;
      const fees = this.ordersService.computeOrderFees(orderVal);
      const orderDetails = {
        symbol,
        strike,
        orderQty,
        txnPrice,
        tt,
        fees,
      };

      if (!finalPos[symbol]?.symbol) {
        const exp = new Date(expiryDate);
        set(finalPos, `${symbol}.symbol`, symbol);
        const month = exp.toLocaleString('default', { month: 'short' }).toUpperCase();
        const dateWithSup = this.commonService.addSup(exp.getDate());
        finalPos[symbol].id = symbol;
        finalPos[symbol].indexSymbol = indexSymbol;
        finalPos[symbol].posFees = fees;
        finalPos[symbol].strike = strike;
        finalPos[symbol].expiry = `${index} ${dateWithSup} ${month}`;
        finalPos[symbol].posQty = orderQty;
        finalPos[symbol].posAvg = +txnPrice;
        finalPos[symbol].posVal = orderVal;
        finalPos[symbol].cumOpenVal = orderVal;
        finalPos[symbol].posOrderList = [orderDetails];
      } else {
        // Compute the position Qty, Value and Average
        const { posQty, posVal, posAvg, posFees } = finalPos[symbol];
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
  }

  /**
   * Compute PnL for each position/strike
   * @param positions -
   * @returns positions with pnl
   */
  computeStrikeWisePnl(positions: StrikewisePosition): PositionWithPnl[] {
    return values(positions).map((position) => {
      const lotSize = this.commonService.getLotSizeBySymbol(position.indexSymbol);
      const { posQty, posAvg, posVal, symbol } = position;
      const strike = this.tapeService.getStrikeData(symbol);
      const lp = strike?.lp || 0;
      const pnl = posQty ? (lp - posAvg) * posQty : 0 - posVal;
      // The following line is required because when loading the app for the first time
      // generally strike may be empty until its fetched
      const curPosVal = posQty * (strike?.lp || 0);
      return {
        ...position,
        lp: lp,
        pnl: +pnl.toFixed(2),
        posQty: posQty / lotSize,
        exitFees: posQty ? this.ordersService.computeOrderFees(curPosVal) : this.defaultExitFees,
      };
    });
  }

  computePositionSummary(pnlPosition: PositionWithPnl[]): PositionSummary {
    const acc = {} as PositionSummary;
    if (!pnlPosition.length) {
      return acc;
    }
    pnlPosition.forEach((cur) => {
      const accPnl = acc.pnl || 0;
      const accMtm = acc.mtm || 0;
      const isActive = cur.posQty !== 0;
      // `pnl` only computed for CLOSED positions
      const pnl = isActive ? accPnl : accPnl + cur.pnl;
      // `mtm` only computed for OPEN positions
      const mtm = isActive ? accMtm + cur.pnl : accMtm;
      const totalFees = cur.posFees.totalFees + (acc.fees?.totalFees || 0);
      const exitTotalFees = cur.exitFees.totalFees + (acc.exitFees?.totalFees || 0);
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
        totalFees: exitTotalFees,
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
  }

  sortPositionList(positions: PositionWithPnl[]): PositionWithPnl[] {
    const res = _(positions)
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
  }

  prepareOrderForMarginCalc(orders) {
    if (!(Array.isArray(orders) && orders.length)) {
      throw Error('Invalid orders');
    }
    return orders.map((order) => {
      const { symbol, posQty, posAvg } = order;
      return {
        symbol,
        qty: posQty,
        side: Math.sign(posQty),
        type: 1,
        limitPrice: posAvg,
      };
    });
  }

  async computePosition(orders: Order[]): Promise<PositionWithSummary> {
    const position = this.computeRawPosition(orders);
    const pnlPosition = this.computeStrikeWisePnl(position);
    const sortedPosition = this.sortPositionList(pnlPosition);
    const summary = this.computePositionSummary(sortedPosition);
    return {
      position: keyBy(sortedPosition, 'symbol'),
      summary,
    };
  }
}
