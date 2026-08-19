import { Test, TestingModule } from '@nestjs/testing';
import { PharmacistRequestsService } from './pharmacist-requests.service';

describe('PharmacistRequestsService', () => {
  let service: PharmacistRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PharmacistRequestsService],
    }).compile();

    service = module.get<PharmacistRequestsService>(PharmacistRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
