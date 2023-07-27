import { Controller, Get, Inject, Logger, Sse } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IndexSymbolObjType } from '../types/index-symbol-obj.type';

@Controller('tape')
export class TapeController {
  private logger = new Logger(TapeController.name);

  constructor(private readonly configService: ConfigService) {}

  @Get('index-objects')
  getContracts(): IndexSymbolObjType {
    return this.configService.get('defaultSymbols') as IndexSymbolObjType;
  }
}
