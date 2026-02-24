import { Module } from '@nestjs/common';
import { ShiftSeriesService } from './shift-series.service';
import { ShiftSeriesController } from './shift-series.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [ShiftSeriesController],
  providers: [ShiftSeriesService, UsersService, EmailService],
  imports: [PrismaModule, AuthModule],
})
export class ShiftSeriesModule {}
