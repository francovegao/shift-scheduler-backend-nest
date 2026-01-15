import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsEmail, IsBoolean, IsOptional, IsDate, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ShiftStatus } from 'generated/prisma';

export class CreateShiftDto {
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

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty()
  startTime: Date;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty()
  endTime: Date;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  payRate: number;

  @IsString()
  @IsNotEmpty()
  @IsEnum(ShiftStatus)
  @ApiProperty()
  status: ShiftStatus;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty()
  published: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  pharmacistId?: string;

}
