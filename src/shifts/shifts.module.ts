import { Module } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';

@Module({
  controllers: [ShiftsController],
  providers: [ShiftsService, UsersService],
  imports: [PrismaModule, AuthModule]
})
export class ShiftsModule {}
