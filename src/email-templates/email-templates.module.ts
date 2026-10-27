import { Module } from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';
import { EmailTemplatesController } from './email-templates.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EmailModule } from 'src/email/email.module';
import { FirebaseService } from 'src/firebase/firebase.service';
import { UsersService } from 'src/users/users.service';

@Module({
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService, FirebaseService, UsersService],
  imports: [PrismaModule, EmailModule],
})
export class EmailTemplatesModule {}
