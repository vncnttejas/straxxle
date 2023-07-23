import { IsString } from 'class-validator';

export class ComputePositionReqDto {
  @IsString()
  startTime: Date;

  @IsString()
  endTime: Date;
}
