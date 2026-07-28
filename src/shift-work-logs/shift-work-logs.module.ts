import { Module } from '@nestjs/common';
import { ShiftWorkLogsService } from './shift-work-logs.service';
import { ShiftWorkLogsController } from './shift-work-logs.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [ShiftWorkLogsController],
  providers: [ShiftWorkLogsService, UsersService, EmailService],
  imports: [PrismaModule, AuthModule],
})
export class ShiftWorkLogsModule {}
