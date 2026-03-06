import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class RequestShiftCancelDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @ApiProperty()
    cancelReason: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @ApiProperty()
    pharmacistProfileId: string;
}