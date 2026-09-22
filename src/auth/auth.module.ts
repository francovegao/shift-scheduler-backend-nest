import { Module } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { EmailService } from 'src/email/email.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  providers: [FirebaseService, EmailService, AuthService],
  imports: [PrismaModule],
  exports: [FirebaseService, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
