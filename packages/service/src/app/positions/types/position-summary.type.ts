import { OrderFees } from 'src/app/orders/types/order-fees.type';

export interface PositionSummary {
  pnl: number;
  mtm: number;
  total: number;
  orderTotal: number;
  orderCount: number;
  activeOrderCount: number;
  exitTotal: number;
  fees: OrderFees;
  exitFees: OrderFees;
}
