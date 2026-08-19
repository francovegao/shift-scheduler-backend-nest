import { Test, TestingModule } from '@nestjs/testing';
import { PharmacistRequestsController } from './pharmacist-requests.controller';
import { PharmacistRequestsService } from './pharmacist-requests.service';

describe('PharmacistRequestsController', () => {
  let controller: PharmacistRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PharmacistRequestsController],
      providers: [PharmacistRequestsService],
    }).compile();

    controller = module.get<PharmacistRequestsController>(PharmacistRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
