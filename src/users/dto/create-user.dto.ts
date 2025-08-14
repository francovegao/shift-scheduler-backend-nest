import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

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
}
