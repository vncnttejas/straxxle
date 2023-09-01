import { OptionDataType } from '../tape/types/option-chain.type';
import { EnrichedOptiontick } from './enriched-option.type';
import { IndexSymbolObjValue } from './index-symbol-obj.type';

export type Enrichedtick = EnrichedOptiontick & OptionDataType & IndexSymbolObjValue;
