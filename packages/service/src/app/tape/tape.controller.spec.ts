import { Test, TestingModule } from '@nestjs/testing';
import { TapeController } from './tape.controller';

describe('TapeController', () => {
  let controller: TapeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TapeController],
    }).compile();

    controller = module.get<TapeController>(TapeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
