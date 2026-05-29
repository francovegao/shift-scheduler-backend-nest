import { Test, TestingModule } from '@nestjs/testing';
import { CancellationRequestsController } from './cancellation-requests.controller';
import { CancellationRequestsService } from './cancellation-requests.service';

describe('CancellationRequestsController', () => {
  let controller: CancellationRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CancellationRequestsController],
      providers: [CancellationRequestsService],
    }).compile();

    controller = module.get<CancellationRequestsController>(CancellationRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
