import { Test, TestingModule } from '@nestjs/testing';
import { PharmacistCommentsController } from './pharmacist-comments.controller';
import { PharmacistCommentsService } from './pharmacist-comments.service';

describe('PharmacistCommentsController', () => {
  let controller: PharmacistCommentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PharmacistCommentsController],
      providers: [PharmacistCommentsService],
    }).compile();

    controller = module.get<PharmacistCommentsController>(
      PharmacistCommentsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
