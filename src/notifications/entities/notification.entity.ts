import { ApiProperty } from "@nestjs/swagger";
import { Notification, NotificationType } from "generated/prisma";

export class NotificationEntity implements Notification {
    @ApiProperty()
    id: string;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    message: string;

    @ApiProperty()
    type: NotificationType;

    @ApiProperty({ required: false, nullable: true })
    actionUrl: string | null;

    @ApiProperty()
    seen: boolean;

    @ApiProperty()
    createdAt: Date;
}
