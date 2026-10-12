import { EmailTemplateRendererService } from './email-template-renderer.service';
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  exports: [EmailService, EmailTemplateRendererService],
  providers: [EmailService, EmailTemplateRendererService],
})
export class EmailModule {}
