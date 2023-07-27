import { Test, TestingModule } from '@nestjs/testing';
import { TapeGateway } from './tape.gateway';

describe('TapeGateway', () => {
  let gateway: TapeGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TapeGateway],
    }).compile();

    gateway = module.get<TapeGateway>(TapeGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
