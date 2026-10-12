import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';
import { EmailModule } from 'src/email/email.module';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, UsersService],
  imports: [PrismaModule, AuthModule, EmailModule],
})
export class CompaniesModule {}
