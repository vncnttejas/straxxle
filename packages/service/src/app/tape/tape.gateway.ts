import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { interval, switchMap } from 'rxjs';
import { Server } from 'socket.io';
import { TapeService } from './tape.service';
import { keys, values } from 'lodash';
import { EnrichedOptiontick } from '../types';

@WebSocketGateway()
export class TapeGateway {
  private logger = new Logger(TapeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private tapeService: TapeService) {}

  @SubscribeMessage('live-tape')
  emitLiveTape() {
    interval(3000)
      .pipe(
        switchMap(async () => {
          if (!this.tapeService.streamLive) {
            return [];
          }
          const tapeData = this.tapeService.getTapeData();
          const currentSymbol = this.tapeService.getLiveTapeContext();
          return values(tapeData).filter((tick: EnrichedOptiontick) => {
            return tick.indexSymbol === currentSymbol;
          });
        }),
      )
      .subscribe((tapeData) => {
        if (keys(tapeData).length) {
          this.logger.verbose(`Emitting option chain data of length: ${keys(tapeData).length}`);
          this.server.emit('live-tape', tapeData);
        }
      });
  }
}
