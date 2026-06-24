import { Test, TestingModule } from '@nestjs/testing';
import { ShiftWorkLogsController } from './shift-work-logs.controller';
import { ShiftWorkLogsService } from './shift-work-logs.service';

describe('ShiftWorkLogsController', () => {
  let controller: ShiftWorkLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShiftWorkLogsController],
      providers: [ShiftWorkLogsService],
    }).compile();

    controller = module.get<ShiftWorkLogsController>(ShiftWorkLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
