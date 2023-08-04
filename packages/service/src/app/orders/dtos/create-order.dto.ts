import { IsDateString, IsNumber, IsString } from 'class-validator';
import { Tag } from 'src/app/tags/entities/tag.entity';

export class CreateOrderDto {
  @IsString()
  symbol: string;

  @IsString()
  strike: string;

  @IsNumber()
  qty: number;

  tags: Tag[];

  @IsNumber()
  txnPrice: number;

  @IsString()
  contractType: string;

  @IsNumber()
  tt: number;
  exchange: string;

  @IsString()
  indexSymbol: string;

  @IsDateString()
  expiryDate: Date;
}
