export interface IndexSymbolObjValue {
  shortName: string;
  prefix: string;
  symbol: string;
  strikeDiff: number;
  strikeExtreme: number;
}

export type IndexSymbolObjType = Record<string, IndexSymbolObjValue>;
