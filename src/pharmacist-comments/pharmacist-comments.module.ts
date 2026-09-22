import { Module } from '@nestjs/common';
import { PharmacistCommentsService } from './pharmacist-comments.service';
import { PharmacistCommentsController } from './pharmacist-comments.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [PharmacistCommentsController],
  providers: [PharmacistCommentsService, UsersService, EmailService],
  imports: [PrismaModule, AuthModule],
})
export class PharmacistCommentsModule {}
