import { EmailTemplateRendererService } from './email-template-renderer.service';
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailTemplateValidationService } from './email-template-validation.service';

@Module({
  exports: [
    EmailService,
    EmailTemplateRendererService,
    EmailTemplateValidationService,
  ],
  providers: [
    EmailService,
    EmailTemplateRendererService,
    EmailTemplateValidationService,
  ],
})
export class EmailModule {}
