import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from "class-validator";

export class NotifyUsersDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    @ApiProperty({ type: [String] })
    userIds: string[];
}