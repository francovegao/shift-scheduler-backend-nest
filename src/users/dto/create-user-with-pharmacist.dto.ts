import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateUserWithPharmacistDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  @ApiProperty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  @ApiProperty()
  lastName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  phone?: string;

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
  @ValidateIf(
    (o) =>
      o.eTransferEmail !== '' &&
      o.eTransferEmail !== undefined &&
      o.eTransferEmail !== null,
  )
  @IsEmail()
  @ApiProperty({ required: false })
  eTransferEmail?: string;

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

  @IsBoolean()
  @ApiProperty({ default: false })
  canViewAllCompanies: boolean;

  @IsBoolean()
  @ApiProperty({ default: true })
  canViewPayRates: boolean;
}
