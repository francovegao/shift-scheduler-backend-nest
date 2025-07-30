import { Module } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ShiftsController],
  providers: [ShiftsService],
  imports: [PrismaModule],
})
export class ShiftsModule {}
