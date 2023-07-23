import { Controller, Get, Query, Sse } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { ComputePositionReqDto } from './dtos/compute-pos-req.dto';
import { Observable, interval, map } from 'rxjs';
import { PositionWithSummary } from './types';

@Controller('position')
export class PositionsController {
  constructor(private positionService: PositionsService) {}

  @Get()
  async computePositions(@Query() query: ComputePositionReqDto): Promise<PositionWithSummary> {
    return this.positionService.computePosition(query);
  }

  @Sse('live')
  getLivePositions(@Query() query: ComputePositionReqDto): Observable<Promise<PositionWithSummary>> {
    return interval(3000).pipe(
      map((_) => {
        return this.positionService.computePosition(query);
      }),
    );
  }
}
