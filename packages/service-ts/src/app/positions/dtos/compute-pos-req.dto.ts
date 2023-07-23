import { IsDate } from 'class-validator';

const defaultStartTime = new Date(new Date().setHours(0, 0, 0, 0));
const defaultEndTime = new Date(new Date().setHours(23, 59, 59, 999));

export class ComputePositionReqDto {
  @IsDate()
  startTime: Date = defaultStartTime;

  @IsDate()
  endTime: Date = defaultEndTime;
}
