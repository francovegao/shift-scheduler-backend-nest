import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateFirebaseUserDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  @ApiProperty()
  email: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  @ApiProperty()
  password: string;
}
