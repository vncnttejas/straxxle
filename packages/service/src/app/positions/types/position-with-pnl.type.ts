import { OrderFees } from 'src/app/orders/types/order-fees.type';
import { OrderDetails } from 'src/app/orders/types/order-details';
import { Position } from './position.type';

export interface PositionWithPnl extends Position {
  lp: number;
  pnl: number;
  posQty: number;
  exitFees: OrderFees;
  posFees: OrderFees;
  posOrderList: OrderDetails[];
}
