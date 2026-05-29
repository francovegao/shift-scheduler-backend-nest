import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RequestStatus, ShiftStatus } from '../../../generated/prisma/client';

export class ProcessCancellationRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(RequestStatus)
  @ApiProperty({ enum: RequestStatus })
  status: RequestStatus;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  reviewedBy: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(ShiftStatus)
  @ApiProperty({ enum: ShiftStatus })
  newShiftStatus: ShiftStatus;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  pharmacistId?: string;
}
