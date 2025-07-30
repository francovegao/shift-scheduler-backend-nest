import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsDateString, IsBoolean } from 'class-validator';


export class CreateShiftAssignmentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @ApiProperty()
  shiftId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @ApiProperty()
  pharmacistId: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty()
  assignedAt: Date;

  @IsBoolean()
  @ApiProperty({ default: false })
  confirmed?: boolean = false;
}
