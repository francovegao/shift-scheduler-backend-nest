import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { RepeatType, ShiftStatus } from "generated/prisma";

export class CreateShiftSeryDto {
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

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  startMinutes: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  endMinutes: number;

  @IsString()
  @IsNotEmpty()
  @IsEnum(RepeatType)
  @ApiProperty()
  repeatType: RepeatType;

  @IsArray()
  @IsNotEmpty()
  @IsInt({ each: true })
  @ApiProperty()
  daysOfWeek: number[];

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty()
  endDate: string;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty()
  excludeWeekends: boolean;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty()
  published: boolean;

  @IsString()
  @IsOptional()
  @IsEnum(ShiftStatus)
  @ApiProperty()
  status: ShiftStatus;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  pharmacistId?: string;
}
