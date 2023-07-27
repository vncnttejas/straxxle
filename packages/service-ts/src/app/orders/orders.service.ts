import { Injectable } from '@nestjs/common';
import { OrderFees } from './types/order-fees.type';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor() {}

  async getOrders(startTime: Date, endTime: Date): Promise<Order[]> {
    const orders = [new Order()];
    return orders;
  }

  computeOrderFees(orderVal: number): OrderFees {
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
      brokerage,
      stt,
      txnCharges,
      gst,
      sebi,
      stamp,
      totalFees,
    };
    Object.keys(response).forEach((key) => {
      response[key] = +response[key].toFixed(2);
    });
    return response;
  }
}
