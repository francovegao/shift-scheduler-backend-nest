import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { FileType } from '../../../generated/prisma/client';

export class CreateFileDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  userId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  companyId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  fileUrl: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  mimeType?: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ required: false })
  size?: number;

  @IsString()
  @IsNotEmpty()
  @IsEnum(FileType)
  @ApiProperty()
  type: FileType;
}
