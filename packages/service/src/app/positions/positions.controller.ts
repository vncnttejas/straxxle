import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { FilterOrderByTimeDto } from '../orders/dtos/filter-order-by-time.dto';
import { PositionWithSummary } from './types';
import { OrdersService } from '../orders/orders.service';

@Controller('position')
export class PositionsController {
  private logger = new Logger(PositionsController.name);

  constructor(private positionService: PositionsService, private ordersService: OrdersService) {}

  @Get()
  async computePositions(@Query() query: FilterOrderByTimeDto): Promise<PositionWithSummary> {
    const orders = await this.ordersService.dbGetOrdersBetweenTime(query);
    return this.positionService.computePosition(orders);
  }

  @Post()
  setPositionContext(@Body() context: FilterOrderByTimeDto) {
    this.logger.log('Setting context to', JSON.stringify(context));
    this.positionService.setFilterContext(context);
  }
}
