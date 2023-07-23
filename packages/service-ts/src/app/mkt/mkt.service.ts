import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import fyersApiV2 from 'fyers-api-v2';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { chunk, flatten } from 'lodash';
import { Optiontick } from '../types/optiontick.type';
import { OnEvent } from '@nestjs/event-emitter';
import { FyersCred } from '../token/types';
import { TapeService } from '../tape/tape.service';

@Injectable()
export class MktService {
  private readonly logger = new Logger(MktService.name);

  constructor(
    private readonly configService: ConfigService,
    private tapeService: TapeService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Fetches data for a given symbol
   */
  async fetchSymbolData(symbol: string): Promise<number> {
    const quotes = new fyersApiV2.quotes();
    const current = await quotes.setSymbol(symbol).getQuotes();
    return current.d[0].v.lp;
  }

  @OnEvent('watchListUpdate', { async: true })
  async triggerListen(): Promise<void> {
    const watchList = await this.cacheManager.get('watchList');
    const maxWatchItems = this.configService.get('maxWatchItems');
    const watchListSymbols = flatten(Object.values(watchList));
    this.logger.log(watchListSymbols, 'Listening for symbol updates');
    const chunkedWatchLists = chunk(watchListSymbols, maxWatchItems);
    const { secret_key: token } = await this.cacheManager.get<FyersCred>('fyersCred');
    chunkedWatchLists.forEach((watchListChunk) => {
      const request = {
        symbol: watchListChunk,
        dataType: 'symbolUpdate',
        token,
      };
      fyersApiV2.fyers_connect(request, async (data: string) => {
        const tickUpdate = JSON.parse(data);
        if (tickUpdate.d?.['7208']?.length) {
          const strikeData = tickUpdate.d['7208'][0].v as Optiontick;
          const { symbol } = strikeData;
          await this.tapeService.setTape(symbol, strikeData);
        }
      });
    });
  }
}
