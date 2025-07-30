import { Test, TestingModule } from '@nestjs/testing';
import { PharmacistProfilesController } from './pharmacist-profiles.controller';
import { PharmacistProfilesService } from './pharmacist-profiles.service';

describe('PharmacistProfilesController', () => {
  let controller: PharmacistProfilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PharmacistProfilesController],
      providers: [PharmacistProfilesService],
    }).compile();

    controller = module.get<PharmacistProfilesController>(PharmacistProfilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
