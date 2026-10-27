import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class EmailTemplateDraftDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subjectTemplate: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  htmlTemplate: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  textTemplate?: string | null;
}
