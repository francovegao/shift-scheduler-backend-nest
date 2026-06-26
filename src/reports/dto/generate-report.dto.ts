import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateReportDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  startDate?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  endDate?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  companyId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  pharmacistId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  type: 'companies' | 'pharmacists' | 'shifts';
}
