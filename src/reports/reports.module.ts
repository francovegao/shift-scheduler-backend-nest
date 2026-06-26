import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { StorageService } from 'src/storage/storage.service';
import { UsersService } from 'src/users/users.service';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, StorageService, UsersService, EmailService],
  imports: [PrismaModule, AuthModule],
})
export class ReportsModule {}
