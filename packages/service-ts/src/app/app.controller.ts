import { Controller, Get, Inject } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/ping')
  getPing(): string {
    return 'pong';
  }
}
