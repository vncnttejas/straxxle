import { IsDateString, IsOptional, IsString } from 'class-validator';

export class TapeContextDto {
  @IsString()
  indexSymbol: string;

  @IsOptional()
  @IsDateString()
  expiry: Date;
}
