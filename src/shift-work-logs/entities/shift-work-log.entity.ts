import { ApiProperty } from '@nestjs/swagger';
import { ShiftWorkLog } from 'generated/prisma/client';

export class ShiftWorkLogEntity implements ShiftWorkLog {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shiftId: string;

  @ApiProperty()
  pharmacistId: string;

  @ApiProperty({ required: false, nullable: true })
  clockIn: Date | null;

  @ApiProperty({ required: false, nullable: true })
  clockOut: Date | null;

  @ApiProperty({ required: false, nullable: true })
  durationHours: number | null;

  @ApiProperty()
  isModified: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
