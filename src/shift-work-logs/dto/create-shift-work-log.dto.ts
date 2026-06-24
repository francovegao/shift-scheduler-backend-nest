import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateShiftWorkLogDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  shiftId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  pharmacistId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  clockIn?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  clockOut?: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ required: false })
  durationHours?: number;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty()
  isModified: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
