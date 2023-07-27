import { IsDateString } from 'class-validator';

const defaultStartTime = new Date(new Date().setHours(0, 0, 0, 0));
const defaultEndTime = new Date(new Date().setHours(23, 59, 59, 999));

export class ComputePositionReqDto {
  @IsDateString()
  startTime: Date = defaultStartTime;

  @IsDateString()
  endTime: Date = defaultEndTime;
}
