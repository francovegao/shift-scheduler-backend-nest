import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsEmail, IsBoolean, IsOptional } from 'class-validator';

export class CreateLocationDto {

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @ApiProperty()
  name: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({ required: false })
  email?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  phone?: string;

  @IsString()
  @ApiProperty({ required: false })
  address?: string;

  @IsString()
  @ApiProperty({ required: false })
  city?: string;

  @IsString()
  @ApiProperty({ required: false })
  province?: string;

  @IsString()
  @ApiProperty({ required: false })
  postalCode?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  companyId: string
}
