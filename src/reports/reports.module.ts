import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { StorageService } from 'src/storage/storage.service';
import { UsersService } from 'src/users/users.service';
import { EmailModule } from 'src/email/email.module';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, StorageService, UsersService],
  imports: [PrismaModule, AuthModule, EmailModule],
})
export class ReportsModule {}
