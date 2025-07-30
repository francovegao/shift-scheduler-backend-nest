import { ApiProperty } from '@nestjs/swagger';
import { ShiftAssignment } from 'generated/prisma';

export class ShiftAssignmentEntity implements ShiftAssignment {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shiftId: string;

  @ApiProperty()
  pharmacistId: string;

  @ApiProperty()
  assignedAt: Date;

  @ApiProperty({default: false})
  confirmed: boolean;
}
