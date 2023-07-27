import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { StoreService } from './store.service';

@Module({
  providers: [CommonService, StoreService],
  exports: [CommonService, StoreService],
})
export class CommonModule {}
