import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateShiftSeryDto } from './create-shift-sery.dto';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DeleteShiftSeriesDto } from './delete-shift-sery.dto';
import { UpdateShiftDto } from 'src/shifts/dto/update-shift.dto';

export class UpdateShiftSeryDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => DeleteShiftSeriesDto)
  shiftSeriesData: DeleteShiftSeriesDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => UpdateShiftDto)
  shiftData: UpdateShiftDto;
}
