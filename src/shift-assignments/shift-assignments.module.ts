import { Module } from '@nestjs/common';
import { ShiftAssignmentsService } from './shift-assignments.service';
import { ShiftAssignmentsController } from './shift-assignments.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ShiftAssignmentsController],
  providers: [ShiftAssignmentsService],
  imports: [PrismaModule],
})
export class ShiftAssignmentsModule {}
