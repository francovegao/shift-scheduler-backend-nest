import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, EmailService],
  imports: [PrismaModule, AuthModule],
//  exports: [UsersService],
})

export class UsersModule {}
