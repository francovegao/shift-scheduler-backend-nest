import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { NotificationType } from "generated/prisma";

export class CreateNotificationDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    title: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    message: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(NotificationType)
    @ApiProperty()
    type: NotificationType;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    actionUrl?: string;

    @IsBoolean()
    @ApiProperty({ default: false })
    seen?: boolean = false;
}
