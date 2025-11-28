import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from 'generated/prisma';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  firebaseUid: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  @ApiProperty({ required: false })
  firstName?: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  @ApiProperty({ required: false })
  lastName?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(Role)
  @ApiProperty()
  role: Role;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  companyId?: string;

  @IsArray()
  @IsOptional()
  @ArrayUnique()
  @ApiProperty({
    required: false,
    type: [String],
    description: 'List of company IDs this user can manage',
    example: ['company-id-1', 'company-id-2'],
  })
  allowedCompaniesIds?: string[];

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  locationId?: string;
}
