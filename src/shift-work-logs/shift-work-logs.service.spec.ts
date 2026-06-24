import { Test, TestingModule } from '@nestjs/testing';
import { ShiftWorkLogsService } from './shift-work-logs.service';

describe('ShiftWorkLogsService', () => {
  let service: ShiftWorkLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShiftWorkLogsService],
    }).compile();

    service = module.get<ShiftWorkLogsService>(ShiftWorkLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
