import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { MktService } from '../mkt/mkt.service';
import { TapeService } from '../tape/tape.service';
import { CommonService } from '../common/common.service';

@Module({
  providers: [TokenService, MktService, TapeService, CommonService],
  controllers: [TokenController],
})
export class TokenModule {}
