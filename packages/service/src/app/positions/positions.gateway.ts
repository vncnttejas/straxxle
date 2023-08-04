import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { interval, switchMap } from 'rxjs';
import { OrdersService } from '../orders/orders.service';
import { PositionsService } from './positions.service';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { keys } from 'lodash';

@WebSocketGateway()
export class PositionsGateway {
  private logger = new Logger(PositionsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private ordersService: OrdersService, private positionsService: PositionsService) {}

  @SubscribeMessage('live-position')
  handleMessage() {
    interval(3000)
      .pipe(
        switchMap(async () => {
          const filterContext = this.positionsService.getFilterContext();
          const orders = await this.ordersService.dbGetOrdersBetweenTime(filterContext);
          return await this.positionsService.computePosition(orders);
        }),
      )
      .subscribe((positionWithSummary) => {
        if (keys(positionWithSummary.position).length) {
          this.logger.verbose('Emitting position data');
          this.server.emit('live-position', positionWithSummary);
        }
      });
  }
}
