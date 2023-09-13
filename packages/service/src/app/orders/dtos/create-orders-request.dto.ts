import { Exclude } from 'class-transformer';
import { ArrayUnique, IsArray, IsNumber, Matches } from 'class-validator';

export class CreateOrdersRequestDto {
  @Exclude()
  id: string;

  @Matches('^NSE:(NIFTY|BANKNIFTY|FINNIFTY)([0-9]{2}[A-Z0-9]{3})([0-9]{3,6})([A-Z]{2})$')
  symbol: string;

  @IsNumber()
  qty: number;

  @IsArray()
  @ArrayUnique()
  tags: string[] = [];
}
