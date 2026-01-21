import { ApiProperty } from "@nestjs/swagger";
import { RepeatType, ShiftSeries } from "generated/prisma";

export class ShiftSery implements ShiftSeries {
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
    payRate: number;

    @ApiProperty()
    startMinutes: number;

    @ApiProperty()
    endMinutes: number;

    @ApiProperty()
    repeatType: RepeatType;

    @ApiProperty()
    daysOfWeek: number[];

    @ApiProperty()
    startDate: Date;

    @ApiProperty()
    endDate: Date;

    @ApiProperty()
    excludeWeekends: boolean;

    @ApiProperty()
    published: boolean;

    @ApiProperty()
    createdAt: Date;

}