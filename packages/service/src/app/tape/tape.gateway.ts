import { Logger } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Observable, interval, switchMap } from 'rxjs';
import { Server } from 'socket.io';
import { TapeService } from './tape.service';
import { keys, values } from 'lodash';
import { TapeContextDto } from './dtos/tape-context.dto';
import { EmitTapeData } from './types/emit-tape.type';
import { EnrichedOptiontick } from '../types';

@WebSocketGateway()
export class TapeGateway {
  private logger = new Logger(TapeGateway.name);

  constructor(private tapeService: TapeService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('live-tape')
  emitLiveTape(@MessageBody() body: TapeContextDto): Observable<EmitTapeData> {
    this.logger.log(body, 'Setting tape context');
    return interval(3000).pipe(
      switchMap(async () => {
        const tapeData = this.tapeService.getTapeData();
        const filteredData = values(tapeData).filter((tick: EnrichedOptiontick) => {
          return tick.indexSymbol === body.indexSymbol;
        });
        this.logger.verbose({ tapeLength: keys(tapeData).length }, 'Emitting option chain data');
        return { event: 'live-tape', data: filteredData } as EmitTapeData;
      }),
    );
  }

  @SubscribeMessage('live-symbol')
  emitLiveSymbol(): Observable<EmitTapeData> {
    return interval(3000).pipe(
      switchMap(async () => {
        const tapeData = this.tapeService.getTapeData();
        const filteredData = values(tapeData).filter((tick: EnrichedOptiontick) => !tick.indexSymbol);
        this.logger.verbose({ tapeLength: keys(tapeData).length }, 'Emitting option chain data');
        return { event: 'live-symbol', data: filteredData } as EmitTapeData;
      }),
    );
  }
}
