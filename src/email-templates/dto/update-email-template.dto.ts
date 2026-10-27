import { IsBoolean, IsOptional } from 'class-validator';
import { EmailTemplateDraftDto } from './create-email-template.dto';

export class UpdateEmailTemplateDto extends EmailTemplateDraftDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
