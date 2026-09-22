import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreatePharmacistCommentDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  pharmacistId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @ApiProperty()
  comment: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  companyId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  locationId?: string;
}
