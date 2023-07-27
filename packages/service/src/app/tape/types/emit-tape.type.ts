import { WsResponse } from '@nestjs/websockets';
import { EnrichedOptiontick, Optiontick } from 'src/app/types';

export type EmitTapeData = WsResponse<Optiontick[] | EnrichedOptiontick[]>;
