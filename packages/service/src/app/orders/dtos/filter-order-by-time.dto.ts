import { IsDateString } from 'class-validator';

export const defaultStartTime = new Date(new Date().setHours(0, 0, 0, 0));
export const defaultEndTime = new Date(new Date().setHours(23, 59, 59, 999));

export class FilterOrderByTimeDto {
  @IsDateString()
  startTime: Date = defaultStartTime;

  @IsDateString()
  endTime: Date = defaultEndTime;
}
