import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsNotEmpty, IsString } from "class-validator";

export class NotifyUsersDto {
    @IsString()
    @ArrayNotEmpty()
    @IsString({ each: true })
    @ApiProperty({ type: [String] })
    userIds: string[];
}