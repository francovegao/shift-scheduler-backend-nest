import { Module } from '@nestjs/common';
import { ShiftSeriesService } from './shift-series.service';
import { ShiftSeriesController } from './shift-series.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';
import { ShiftsService } from 'src/shifts/shifts.service';
import { EmailModule } from 'src/email/email.module';

@Module({
  controllers: [ShiftSeriesController],
  providers: [ShiftSeriesService, UsersService, ShiftsService],
  imports: [PrismaModule, AuthModule, EmailModule],
})
export class ShiftSeriesModule {}
