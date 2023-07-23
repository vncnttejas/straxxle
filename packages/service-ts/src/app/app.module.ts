import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from '../config/configuration';
import { OrdersModule } from './orders/orders.module';
import { TokenModule } from './token/token.module';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppService } from './app.service';
import { PositionsModule } from './positions/positions.module';
import { CommonService } from './common/common.service';
import { TagsModule } from './tags/tags.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TapeService } from './tape/tape.service';
import { TapeModule } from './tape/tape.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('database'),
    }),
    EventEmitterModule.forRoot(),
    TokenModule,
    OrdersModule,
    PositionsModule,
    TagsModule,
    TapeModule,
  ],
  controllers: [AppController],
  providers: [AppService, CommonService, TapeService],
})
export class AppModule {}
