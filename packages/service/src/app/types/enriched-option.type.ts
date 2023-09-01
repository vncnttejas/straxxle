import { Optiontick } from './optiontick.type';

export interface EnrichedOptiontick extends Optiontick {
  index: string;
  indexSymbol: string;
  rawExpiry: string;
  strike: string;
  strikePrice: number;
  strikeDiffPts: number;
  strikesAway: number;
  strikeType: string;
  contractType: string;
  expiryType: string;
  optionExpiry: Date;
  oiPercentile: number;
  expiryDateStr: string;
}
