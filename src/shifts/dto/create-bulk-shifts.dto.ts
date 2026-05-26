import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ShiftStatus } from 'generated/prisma/client';

export class CreateBulkShiftsDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  companyId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  locationId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  payRate: number;

  @IsString()
  @IsNotEmpty()
  @IsEnum(ShiftStatus)
  @ApiProperty()
  status: ShiftStatus;

  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  @ApiProperty()
  dates: string[];

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  startMinutes: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  endMinutes: number;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty()
  published: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  pharmacistId?: string;
}
