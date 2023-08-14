import { Injectable } from '@nestjs/common';
import { OrderFees } from './types/order-fees.type';
import { Order } from './entities/order.entity';
import { CreateOrdersRequestDto } from './dtos/create-orders-request.dto';
import { TapeService } from '../tape/tape.service';
import { EnrichedOptiontick } from '../types';
import { CommonService } from '../common/common.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Tag } from '../tags/entities/tag.entity';
import { FilterOrderByTimeDto } from '../positions/dtos';

@Injectable()
export class OrdersService {
  constructor(
    private tapeService: TapeService,
    private commonService: CommonService,
    @InjectRepository(Order) private orderRepository: Repository<Order>,
  ) {}

  async dbGetOrdersBetweenTime(times: FilterOrderByTimeDto) {
    const { startTime, endTime } = times;
    return this.orderRepository.find({
      where: {
        createdAt: Between(startTime, endTime),
      },
    });
  }

  async dbInsertOrders(orders: CreateOrderDto[]) {
    const orderEntities = this.orderRepository.create(orders);
    await this.orderRepository.save(orderEntities);
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

  enrichOrderForDb(order: CreateOrdersRequestDto) {
    const strikeSnapshot = this.tapeService.getStrikeData(order.symbol) as EnrichedOptiontick;
    const lotSize = this.commonService.getLotSizeBySymbol(strikeSnapshot.indexSymbol);
    if (order.qty % lotSize !== 0) {
      throw Error(`Order qty can only be multiples of ${lotSize}`);
    }
    if (!strikeSnapshot) {
      throw Error('Strike Not Found');
    }
    const tags = order.tags.map((name) =>
      Tag.create({
        name,
      }),
    );
    return {
      ...order,
      tags,
      strike: strikeSnapshot.strike,
      txnPrice: strikeSnapshot.ask,
      contractType: strikeSnapshot.contractType,
      tt: strikeSnapshot.tt,
      exchange: strikeSnapshot.exchange,
      expiryDate: new Date(strikeSnapshot.expiryDate),
      expiryType: strikeSnapshot.expiryType,
      indexSymbol: strikeSnapshot.indexSymbol,
    };
  }
}
