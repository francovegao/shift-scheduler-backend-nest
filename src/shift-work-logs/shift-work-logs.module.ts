import { Module } from '@nestjs/common';
import { ShiftWorkLogsService } from './shift-work-logs.service';
import { ShiftWorkLogsController } from './shift-work-logs.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';
import { EmailModule } from 'src/email/email.module';

@Module({
  controllers: [ShiftWorkLogsController],
  providers: [ShiftWorkLogsService, UsersService],
  imports: [PrismaModule, AuthModule, EmailModule],
})
export class ShiftWorkLogsModule {}
