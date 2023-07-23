import { Module } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { PositionsController } from './positions.controller';
import { OrdersService } from '../orders/orders.service';
import { CommonService } from '../common/common.service';
import { TapeService } from '../tape/tape.service';

@Module({
  controllers: [PositionsController],
  providers: [PositionsService, OrdersService, CommonService, TapeService],
})
export class PositionsModule {}
