import { Module } from '@nestjs/common';
import { CancellationRequestsService } from './cancellation-requests.service';
import { CancellationRequestsController } from './cancellation-requests.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [CancellationRequestsController],
  providers: [CancellationRequestsService, UsersService, EmailService],
  imports: [PrismaModule, AuthModule],
})
export class CancellationRequestsModule {}
