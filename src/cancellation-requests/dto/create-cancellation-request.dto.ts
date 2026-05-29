import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { RequestStatus } from '../../../generated/prisma/client';

export class CreateCancellationRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  shiftId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  pharmacistId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @ApiProperty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(RequestStatus)
  @ApiProperty()
  status: RequestStatus;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  reviewedAt?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  reviewedBy?: string;
}
