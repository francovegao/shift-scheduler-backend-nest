import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateReportDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  startDate?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  endDate?: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({ required: false, type: [String] })
  companyIds?: string[];

  @IsArray()
  @IsOptional()
  @ApiProperty({ required: false, type: [String] })
  pharmacistIds?: string[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ enum: ['shifts', 'company', 'pharmacist'] })
  type: 'shifts' | 'company' | 'pharmacist';
}
