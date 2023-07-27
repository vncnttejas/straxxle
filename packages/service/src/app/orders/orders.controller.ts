import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('orders')
export class OrdersController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getOrders(): string {
    return 'orders';
  }
}
