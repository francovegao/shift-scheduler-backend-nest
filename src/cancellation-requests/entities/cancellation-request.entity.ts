import { ApiProperty } from '@nestjs/swagger';
import {
  RequestStatus,
  ShiftCancellationRequest,
} from '../../../generated/prisma/client';

export class CancellationRequestsEntity implements ShiftCancellationRequest {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shiftId: string;

  @ApiProperty()
  pharmacistId: string;

  @ApiProperty()
  reason: string;

  @ApiProperty()
  status: RequestStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false, nullable: true })
  reviewedAt: Date | null;

  @ApiProperty({ required: false, nullable: true })
  reviewedBy: string | null;
}
