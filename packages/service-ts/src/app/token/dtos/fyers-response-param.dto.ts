import { IsString } from 'class-validator';

export class FyersResponseParamsDto {
  @IsString()
  s: string;

  @IsString()
  code: string;

  @IsString()
  auth_code: string;

  @IsString()
  state: string;
}
