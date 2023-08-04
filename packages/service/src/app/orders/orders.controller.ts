import { Body, Controller, ParseArrayPipe, Post } from '@nestjs/common';
import { CreateOrdersRequestDto } from './dtos/create-orders-request.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  async createOrders(@Body(new ParseArrayPipe({ items: CreateOrdersRequestDto })) orders: CreateOrdersRequestDto[]) {
    const enrichedOrders = orders.map((order) => this.ordersService.enrichOrderForDb(order));
    await this.ordersService.dbInsertOrders(enrichedOrders);
    return {
      success: true,
    };
  }
}
