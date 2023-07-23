import { OrderDetails } from 'src/app/orders/types/order-details';
import { OrderFees } from 'src/app/orders/types/order-fees.type';

export type StrikewisePosition = Record<
  string,
  {
    id: string;
    posFees: OrderFees;
    strike: string;
    expiry: string;
    posQty: number;
    posAvg: number;
    posVal: number;
    symbol: string;
    cumOpenVal: number;
    posOrderList: OrderDetails[];
  }
>;
