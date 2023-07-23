import { OrderFees } from 'src/app/orders/types/order-fees.type';
import { Position } from './position.type';
import { OrderDetails } from 'src/app/orders/types/order-details';

export interface PositionWithPnl extends Position {
  lp: number;
  pnl: number;
  posQty: number;
  exitFees: OrderFees;
  posFees: OrderFees;
  posOrderList: OrderDetails[];
}
