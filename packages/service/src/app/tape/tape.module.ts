import { Module } from '@nestjs/common';
import { TapeService } from './tape.service';
import { TapeController } from './tape.controller';
import { TapeGateway } from './tape.gateway';
import { CommonModule } from '../common/common.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [TapeController],
  providers: [TapeService, TapeGateway],
  exports: [TapeService],
})
export class TapeModule {}
