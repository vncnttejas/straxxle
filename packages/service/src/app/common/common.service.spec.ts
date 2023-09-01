import { Test, TestingModule } from '@nestjs/testing';
import { CommonService } from './common.service';
import { ConfigService } from '@nestjs/config';

describe('CommonService', () => {
  let service: CommonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService, CommonService],
    }).compile();

    service = module.get<CommonService>(CommonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSymbolDateStr()', () => {
    it('should test for weekly expiry', () => {
      const dateEpoch = new Date('2023-08-24').getTime();
      const expiryStr = service.createSymbolDateStr(dateEpoch);
      expect(expiryStr).toBe('23824');
    });

    it('should test for october weekly expiry', () => {
      const dateEpoch = new Date('2023-10-5').getTime();
      const expiryStr = service.createSymbolDateStr(dateEpoch);
      expect(expiryStr).toBe('23O05');
    });

    it('should test for monthly expiry', () => {
      const dateEpoch = new Date('2023-8-31').getTime();
      const expiryStr = service.createSymbolDateStr(dateEpoch);
      expect(expiryStr).toBe('23AUG');
    });
  });
});
