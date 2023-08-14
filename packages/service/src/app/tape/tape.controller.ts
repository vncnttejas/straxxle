import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IndexSymbolObjType } from '../types/index-symbol-obj.type';
import { TapeService } from './tape.service';
import { SetContextDto } from './dtos/tape-set-context.dto';

@Controller('tape')
export class TapeController {
  private logger = new Logger(TapeController.name);

  constructor(private readonly configService: ConfigService, private tapeService: TapeService) {
    this.tapeService.watchOptionChainData();
  }

  @Get('index-objects')
  getContracts(): IndexSymbolObjType {
    return this.configService.get('defaultSymbols') as IndexSymbolObjType;
  }

  @Post('set-live-context')
  setLiveContext(@Body() context: SetContextDto) {
    this.logger.log('Setting context to', JSON.stringify(context));
    if (context.reset) {
      this.tapeService.setLiveTapeContext(null);
      this.tapeService.streamLive = false;
      return;
    }
    this.tapeService.setLiveTapeContext(context.indexSymbol);
    this.tapeService.streamLive = true;
    return;
  }
}
