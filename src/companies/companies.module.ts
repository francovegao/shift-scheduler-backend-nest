import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, UsersService, EmailService],
  imports: [PrismaModule, AuthModule],
})
export class CompaniesModule {}
