import { PartialType } from '@nestjs/swagger';
import { CreatePharmacistRequestDto } from './create-pharmacist-request.dto';

export class UpdatePharmacistRequestDto extends PartialType(
  CreatePharmacistRequestDto,
) {}
