import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { FirebaseService } from 'src/firebase/firebase.service';
import { UsersService } from 'src/users/users.service';
import { EmailModule } from 'src/email/email.module';

@Module({
  controllers: [StorageController],
  providers: [StorageService, FirebaseService, UsersService],
  imports: [PrismaModule, AuthModule, EmailModule],
})
export class StorageModule {}
