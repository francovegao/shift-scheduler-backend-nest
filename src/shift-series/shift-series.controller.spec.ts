import { Test, TestingModule } from '@nestjs/testing';
import { ShiftSeriesController } from './shift-series.controller';
import { ShiftSeriesService } from './shift-series.service';

describe('ShiftSeriesController', () => {
  let controller: ShiftSeriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShiftSeriesController],
      providers: [ShiftSeriesService],
    }).compile();

    controller = module.get<ShiftSeriesController>(ShiftSeriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
