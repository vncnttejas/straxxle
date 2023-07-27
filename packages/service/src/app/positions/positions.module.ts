import { Module } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { PositionsController } from './positions.controller';
import { CommonModule } from '../common/common.module';
import { TapeModule } from '../tape/tape.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [CommonModule, TapeModule, OrdersModule],
  controllers: [PositionsController],
  providers: [PositionsService],
})
export class PositionsModule {}
