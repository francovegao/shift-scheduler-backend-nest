import { Module } from '@nestjs/common';
import { CancellationRequestsService } from './cancellation-requests.service';
import { CancellationRequestsController } from './cancellation-requests.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';
import { EmailModule } from 'src/email/email.module';

@Module({
  controllers: [CancellationRequestsController],
  providers: [CancellationRequestsService, UsersService],
  imports: [PrismaModule, AuthModule, EmailModule],
})
export class CancellationRequestsModule {}
