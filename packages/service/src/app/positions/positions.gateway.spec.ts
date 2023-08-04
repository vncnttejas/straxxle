import { Test, TestingModule } from '@nestjs/testing';
import { PositionsGateway } from './positions.gateway';

describe('PositionsGateway', () => {
  let gateway: PositionsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PositionsGateway],
    }).compile();

    gateway = module.get<PositionsGateway>(PositionsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
