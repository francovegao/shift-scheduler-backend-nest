import { Test, TestingModule } from '@nestjs/testing';
import { CancellationRequestsService } from './cancellation-requests.service';

describe('CancellationRequestsService', () => {
  let service: CancellationRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CancellationRequestsService],
    }).compile();

    service = module.get<CancellationRequestsService>(CancellationRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
