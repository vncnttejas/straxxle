import { Controller, Get, Query } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { keyBy } from 'lodash';
import { OrdersService } from '../orders/orders.service';
import { ComputePositionReqDto } from './dtos/compute-pos-req.dto';
import { IndexedPosition } from './types/indexed-position';

@Controller('position')
export class PositionsController {
  constructor(private orderService: OrdersService, private positionService: PositionsService) {}

  @Get()
  async computePositions(@Query() query: ComputePositionReqDto) {
    const { startTime, endTime } = query;
    const filteredOrders = await this.orderService.getOrders(startTime, endTime);
    const position = this.positionService.computeRawPosition(filteredOrders);
    const pnlPosition = this.positionService.computeStrikeWisePnl(position as unknown as IndexedPosition);
    const sortedPosition = this.positionService.sortPositionList(pnlPosition);
    const summary = this.positionService.computePositionSummary(sortedPosition);

    return {
      live: true,
      position: keyBy(sortedPosition, 'symbol'),
      summary,
    };
  }
}
