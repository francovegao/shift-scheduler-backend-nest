import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsNumber,
  ValidateIf,
  IsArray,
  ArrayUnique,
  IsObject,
  ValidateNested,
} from 'class-validator';

class CompanyPermissionDto {
  @IsString()
  companyId: string;

  @IsBoolean()
  canViewPayRate: boolean;
}

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
  @ValidateIf((o) => o.email !== '') // Apply IsEmail only if email is not an empty string
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

  @IsBoolean()
  @ApiProperty({ default: false })
  canViewAllCompanies: boolean;

  @IsBoolean()
  @ApiProperty({ default: true })
  canViewPayRates: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CompanyPermissionDto)
  @ApiProperty({ type: [CompanyPermissionDto], required: false })
  companyPermissions?: CompanyPermissionDto[];
}
