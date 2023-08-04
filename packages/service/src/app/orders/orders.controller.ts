import { Body, Controller, Get, ParseArrayPipe, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateOrdersRequestDto } from './dtos/create-orders-request.dto';
import { TapeService } from '../tape/tape.service';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService, private tapeService: TapeService) {}

  @Get()
  getOrders(): string {
    return 'orders';
  }

  @Post()
  async createOrders(@Body(new ParseArrayPipe({ items: CreateOrdersRequestDto })) orders: CreateOrdersRequestDto[]) {
    const enrichedOrders = orders.map((order) => this.ordersService.enrichOrderForDb(order));
    await this.ordersService.dbInsertOrders(enrichedOrders);
    return {
      success: true,
    };
  }
}
