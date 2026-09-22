import { Test, TestingModule } from '@nestjs/testing';
import { PharmacistCommentsService } from './pharmacist-comments.service';

describe('PharmacistCommentsService', () => {
  let service: PharmacistCommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PharmacistCommentsService],
    }).compile();

    service = module.get<PharmacistCommentsService>(PharmacistCommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
