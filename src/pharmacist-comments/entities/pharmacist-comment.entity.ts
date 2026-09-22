import { ApiProperty } from '@nestjs/swagger';
import { PharmacistComment } from 'generated/prisma/client';

export class PharmacistCommentEntity implements PharmacistComment {
  @ApiProperty()
  id: string;

  @ApiProperty()
  pharmacistId: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  comment: string;

  @ApiProperty({ required: false, nullable: true })
  companyId: string | null;

  @ApiProperty({ required: false, nullable: true })
  locationId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
