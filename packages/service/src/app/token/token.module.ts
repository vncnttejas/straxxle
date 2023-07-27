import { Module } from '@nestjs/common';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { CommonModule } from '../common/common.module';
import { TapeModule } from '../tape/tape.module';

@Module({
  imports: [CommonModule, TapeModule],
  controllers: [TokenController],
  providers: [TokenService],
})
export class TokenModule {}
