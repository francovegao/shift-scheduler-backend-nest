import { Test, TestingModule } from '@nestjs/testing';
import { PharmacistProfilesService } from './pharmacist-profiles.service';

describe('PharmacistProfilesService', () => {
  let service: PharmacistProfilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PharmacistProfilesService],
    }).compile();

    service = module.get<PharmacistProfilesService>(PharmacistProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
