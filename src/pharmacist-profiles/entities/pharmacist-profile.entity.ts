import { ApiProperty } from '@nestjs/swagger';
import { PharmacistProfile } from 'generated/prisma';

export class PharmacistProfileEntity implements PharmacistProfile {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ required: false, nullable: true })
  licenseNumber: string | null;

  @ApiProperty({ required: false, nullable: true })
  address: string | null;

  @ApiProperty({ required: false, nullable: true })
  city: string | null;

  @ApiProperty({ required: false, nullable: true })
  province: string | null;

  @ApiProperty({ required: false, nullable: true })
  postalCode: string | null;

  @ApiProperty({ required: false, nullable: true })
  email: string | null;

  @ApiProperty({ required: false, nullable: true })
  bio: string | null;

  @ApiProperty({ required: false, nullable: true })
  experienceYears: number | null;

  @ApiProperty({default: false})
  approved: boolean;

  @ApiProperty({default: false})
  canViewAllCompanies: boolean;

  @ApiProperty()
  createdAt: Date;
}
