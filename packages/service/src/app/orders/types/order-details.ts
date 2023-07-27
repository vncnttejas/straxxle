import { OrderFees } from './order-fees.type';

export interface OrderDetails {
  symbol: string;
  strike: string;
  orderQty: number;
  txnPrice: number;
  tt: number;
  fees: OrderFees;
}
