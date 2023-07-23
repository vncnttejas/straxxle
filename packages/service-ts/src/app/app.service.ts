import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

interface LiveSymbolValue {
  current: number;
}

export type LiveSymbolData = Record<string, LiveSymbolValue>;

@Injectable()
export class AppService {
  private logger = new Logger(AppService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.logger.verbose('Setting some default values to the store');
    Promise.all([
      this.cacheManager.set('tape', {}, 0),
      this.cacheManager.set('subTape', {}, 0),
      this.cacheManager.set('fyersCred', null, 0),
      this.cacheManager.set('watchList', [], 0),
      this.cacheManager.set('ocContext', null, 0),
      this.cacheManager.set('getAll', false, 0),
      this.cacheManager.set('streamLive', false, 0),
      this.cacheManager.set('liveSymbolData', {} as LiveSymbolData, 0),
    ]);
  }
}
