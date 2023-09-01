export interface IndexSymbolObjValue {
  indexShortName: string;
  indexPrefix: string;
  indexSymbol: string;
  strikeDiff: number;
  strikeExtreme: number;
  lotSize: number;
}

export type IndexSymbolObjType = Record<string, IndexSymbolObjValue>;
