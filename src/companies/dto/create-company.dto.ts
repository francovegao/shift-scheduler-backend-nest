import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsEmail, IsBoolean } from 'class-validator';

export class CreateCompanyDto {
  
  @IsBoolean()
  @ApiProperty({ default: true })
  approved?: boolean = true;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty({ required: false })
  legalName?: string;

  @IsString()
  @ApiProperty({ required: false })
  GSTNumber?: string;

  @IsEmail()
  @ApiProperty({ required: false })
  email?: string;

  @IsString()
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
}

