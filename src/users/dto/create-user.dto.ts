import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: false })
  firstName?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: false })
  lastName?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  phone?: string;
}
