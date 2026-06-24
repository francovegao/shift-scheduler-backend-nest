import { Module } from '@nestjs/common';
import { ShiftWorkLogsService } from './shift-work-logs.service';
import { ShiftWorkLogsController } from './shift-work-logs.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [ShiftWorkLogsController],
  providers: [ShiftWorkLogsService],
  imports: [PrismaModule, AuthModule],
})
export class ShiftWorkLogsModule {}
