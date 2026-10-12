import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [PrismaModule, AuthModule, EmailModule],
  //  exports: [UsersService],
})
export class UsersModule {}
