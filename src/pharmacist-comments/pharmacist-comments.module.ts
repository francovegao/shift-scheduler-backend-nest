import { Module } from '@nestjs/common';
import { PharmacistCommentsService } from './pharmacist-comments.service';
import { PharmacistCommentsController } from './pharmacist-comments.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';
import { EmailModule } from 'src/email/email.module';

@Module({
  controllers: [PharmacistCommentsController],
  providers: [PharmacistCommentsService, UsersService],
  imports: [PrismaModule, AuthModule, EmailModule],
})
export class PharmacistCommentsModule {}
