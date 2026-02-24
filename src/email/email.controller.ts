import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EmailService } from "./email.service";


@Controller('email')
@ApiTags('Email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // @Post('send-welcome')
  // async sendWelcomeEmail(@Body('recipient') recipient: string) {
  //   const subject = 'Welcome to Our App!';
  //   const htmlContent = '<h1>Hello!</h1><p>Thanks for signing up.</p>';
    
  //   await this.emailService.sendTestEmail(recipient, subject, htmlContent);
  //   return { message: 'Welcome email sent successfully' };
  // }

  // @Post('send-test')
  // async sendTestEmail() {
  //   const subject = 'Welcome to Our App!';
  //   const htmlContent = '<h1>Hello!</h1><p>Thanks for signing up.</p>';
    
  //   await this.emailService.sendTestEmail("oliver.franco@createcompounding.ca", subject, htmlContent);
  //   return { message: 'Welcome email sent successfully' };
  // }
}