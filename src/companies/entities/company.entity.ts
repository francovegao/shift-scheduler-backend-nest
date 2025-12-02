import { ApiProperty } from '@nestjs/swagger';
import { Company } from 'generated/prisma';

export class CompanyEntity implements Company {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false})
  approved: boolean;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  legalName: string | null;

  @ApiProperty({ required: false, nullable: true })
  GSTNumber: string | null;

  @ApiProperty({ required: false, nullable: true })
  email: string | null;

  @ApiProperty({ required: false, nullable: true })
  phone: string | null;

  @ApiProperty({ required: false, nullable: true })
  address: string | null;

  @ApiProperty({ required: false, nullable: true })
  city: string | null;

  @ApiProperty({ required: false, nullable: true })
  province: string | null;

  @ApiProperty({ required: false, nullable: true })
  postalCode: string | null;

  @ApiProperty({ required: false, nullable: true })
  contactName: string | null;

  @ApiProperty({ required: false, nullable: true })
  contactPhone: string | null;

  @ApiProperty({ required: false, nullable: true })
  contactEmail: string | null;

  @ApiProperty()
  createdAt: Date;
}

