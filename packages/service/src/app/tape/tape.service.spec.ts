import { Test, TestingModule } from '@nestjs/testing';
import { TapeService } from './tape.service';

describe('TapeService', () => {
  let service: TapeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TapeService],
    }).compile();

    service = module.get<TapeService>(TapeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
