import { Module } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FirebaseService } from 'src/firebase/firebase.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [ShiftsController],
  providers: [ShiftsService],
  imports: [PrismaModule, AuthModule],
})
export class ShiftsModule {}
