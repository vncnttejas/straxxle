import { Test, TestingModule } from '@nestjs/testing';
import { MktService } from './mkt.service';

describe('MktService', () => {
  let service: MktService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MktService],
    }).compile();

    service = module.get<MktService>(MktService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
