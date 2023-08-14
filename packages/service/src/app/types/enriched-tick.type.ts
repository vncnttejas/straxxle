import { OptionDataType } from '../tape/types/option-chain.type';
import { EnrichedOptiontick } from './enriched-option.type';
import { Optiontick } from './optiontick.type';

export type Enrichedtick = (EnrichedOptiontick & OptionDataType) | Optiontick;
