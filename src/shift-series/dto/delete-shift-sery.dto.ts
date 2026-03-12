import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class DeleteShiftSeriesDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  scope: "future" | "all";

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  referenceShiftId: string;
}