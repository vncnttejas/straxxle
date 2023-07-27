import { Injectable } from '@nestjs/common';
import { get, set } from 'lodash';

type StoreType = {
  currentValues: Record<string, number>;
  watchList: string[];
};

@Injectable()
export class StoreService {
  private store: StoreType = {
    currentValues: {} as Record<string, number>,
    watchList: [] as string[],
  };

  getStoreData<T>(key: string): T {
    const data = get(this.store, key);
    if (!data) {
      throw new Error(`data ${key} not found in store`);
    }
    return data;
  }

  searchStoreData(callback: Function): unknown {
    return callback(this.store);
  }

  setStoreData<T>(symbol: string, data: T): void {
    set<StoreType>(this.store, symbol, data);
  }
}
