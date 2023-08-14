import { Optiontick } from './optiontick.type';

export interface EnrichedOptiontick extends Optiontick {
  index: string;
  indexSymbol: string;
  rawExpiry: string;
  strike: string;
  strikeNum: number;
  strikeDiffPts: number;
  strikesAway: number;
  strikeType: string;
  contractType: string;
  expiryType: string;
  expiryDate: Date;
}
