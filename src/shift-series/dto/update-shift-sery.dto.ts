import { PartialType } from '@nestjs/swagger';
import { CreateShiftSeryDto } from './create-shift-sery.dto';

export class UpdateShiftSeryDto extends PartialType(CreateShiftSeryDto) {}
