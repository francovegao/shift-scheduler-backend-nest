import { ApiProperty } from '@nestjs/swagger';
import { Shift, ShiftStatus } from 'generated/prisma';

export class ShiftEntity implements Shift {
    @ApiProperty()
    id: string;

    @ApiProperty()
    companyId: string;

    @ApiProperty({ required: false, nullable: true })
    locationId: string | null;

    @ApiProperty()
    title: string;

    @ApiProperty({ required: false, nullable: true })
    description: string | null;
    
    @ApiProperty()
    startTime: Date;

    @ApiProperty()
    endTime: Date;

    @ApiProperty()
    payRate: number;

    @ApiProperty()
    status: ShiftStatus;

    @ApiProperty()
    published: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    pharmacistId: string;
}
