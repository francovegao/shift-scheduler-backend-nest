import { PartialType } from '@nestjs/swagger';
import { CreatePharmacistProfileDto } from './create-pharmacist-profile.dto';

export class UpdatePharmacistProfileDto extends PartialType(CreatePharmacistProfileDto) {}
