import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';
import { NotificationsListener } from './notifications.listeners';
import { EmailModule } from 'src/email/email.module';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsListener, UsersService],
  imports: [PrismaModule, AuthModule, EmailModule],
})
export class NotificationsModule {}
