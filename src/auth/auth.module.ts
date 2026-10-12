import { Module } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EmailModule } from 'src/email/email.module';

@Module({
  providers: [FirebaseService, AuthService],
  imports: [PrismaModule, EmailModule],
  exports: [FirebaseService, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
