import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectPharmacistRequestDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  rejectionReason?: string;
}
