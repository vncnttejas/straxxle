import { EnrichedOptiontick } from './enriched-option.type';

export type ShortOptiontickType = Pick<
  EnrichedOptiontick,
  'symbol' | 'contractType' | 'strike' | 'strikePrice' | 'strikeType'
>;
