import { ApiProperty } from '@nestjs/swagger';
import { Location } from 'generated/prisma';


export class LocationEntity implements Location {
  @ApiProperty()
  id: string;

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

  @ApiProperty({ required: false})
  timezone: string;

  @ApiProperty()
  companyId: string;
}
