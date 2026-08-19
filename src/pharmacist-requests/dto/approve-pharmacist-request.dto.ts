import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ApprovePharmacistRequestDto {
  @IsBoolean()
  @ApiProperty({ default: false })
  approved: boolean;

  @IsBoolean()
  @ApiProperty({ default: false })
  canViewAllCompanies: boolean;

  @IsBoolean()
  @ApiProperty({ default: true })
  canViewPayRates: boolean;
}
