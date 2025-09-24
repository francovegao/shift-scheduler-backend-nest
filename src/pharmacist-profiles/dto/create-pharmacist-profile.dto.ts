import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsEmail, IsBoolean, IsOptional, IsNumber, ValidateIf } from 'class-validator';

export class CreatePharmacistProfileDto {

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @ApiProperty()
  userId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  licenseNumber?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  address?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  city?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  province?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  postalCode?: string;

  @IsOptional()
  @ValidateIf(o => o.email !== '') // Apply IsEmail only if email is not an empty string
  @IsEmail()
  @ApiProperty({ required: false })
  email?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  bio?: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ required: false })
  experienceYears?: number;

  @IsBoolean()
  @ApiProperty({ default: false })
  approved: boolean;
}
