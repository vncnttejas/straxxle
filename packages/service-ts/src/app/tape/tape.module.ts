import { Module } from '@nestjs/common';
import { TapeService } from './tape.service';
import { TapeController } from './tape.controller';
import { CommonService } from '../common/common.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [TapeController],
  providers: [TapeService, CommonService, ConfigService],
})
export class TapeModule {}
