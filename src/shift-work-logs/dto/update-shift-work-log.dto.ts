import { PartialType } from '@nestjs/swagger';
import { CreateShiftWorkLogDto } from './create-shift-work-log.dto';

export class UpdateShiftWorkLogDto extends PartialType(CreateShiftWorkLogDto) {}
