import { Test, TestingModule } from '@nestjs/testing';
import { ShiftSeriesService } from './shift-series.service';

describe('ShiftSeriesService', () => {
  let service: ShiftSeriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShiftSeriesService],
    }).compile();

    service = module.get<ShiftSeriesService>(ShiftSeriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
