import { ApiProperty } from '@nestjs/swagger';
import { PharmacistRequest, RequestStatus } from 'generated/prisma/client';

export class PharmacistRequestsEntity implements PharmacistRequest {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false, nullable: true })
  phone: string | null;

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
  bio: string | null;

  @ApiProperty({ required: false, nullable: true })
  experienceYears: number | null;

  @ApiProperty({ required: false, nullable: true })
  eTransferEmail: string | null;

  @ApiProperty()
  submittedById: string;

  @ApiProperty()
  status: RequestStatus;

  @ApiProperty({ required: false, nullable: true })
  reviewedById: string | null;

  @ApiProperty({ required: false, nullable: true })
  reviewedAt: Date | null;

  @ApiProperty({ required: false, nullable: true })
  rejectionReason: string | null;

  @ApiProperty({ required: false, nullable: true })
  createdUserId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
