import { Module } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [FirebaseService],
  imports: [PrismaModule],
  exports: [FirebaseService],
})
export class AuthModule {}