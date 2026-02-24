import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';
import { NotificationsListener } from './notifications.listeners';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsListener, UsersService, EmailService],
  imports: [PrismaModule, AuthModule],
})
export class NotificationsModule {}
