import { IsEmail, MaxLength } from 'class-validator';
import { EmailTemplateDraftDto } from './create-email-template.dto';

export class SendTestEmailDto extends EmailTemplateDraftDto {
  @IsEmail()
  @MaxLength(254)
  recipientEmail: string;
}
