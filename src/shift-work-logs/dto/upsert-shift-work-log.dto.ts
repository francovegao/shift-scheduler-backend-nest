import {
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
  IsString,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpsertWorkLogDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  id?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  shiftId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  pharmacistId: string;

  @IsNumber()
  @Min(0)
  @Max(1439)
  @IsNotEmpty()
  @ApiProperty({ example: 480 })
  startMinutes: number;

  @IsNumber()
  @Min(0)
  @Max(1440)
  @IsNotEmpty()
  @ApiProperty({ example: 1020 })
  endMinutes: number;
}
