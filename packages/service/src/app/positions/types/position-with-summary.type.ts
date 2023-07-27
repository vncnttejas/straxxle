import { IndexedPosition } from './indexed-position.type';
import { PositionSummary } from './position-summary.type';

export interface PositionWithSummary {
  position: IndexedPosition;
  summary: PositionSummary;
}
