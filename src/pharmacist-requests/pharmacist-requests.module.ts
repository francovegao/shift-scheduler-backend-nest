import { Module } from '@nestjs/common';
import { PharmacistRequestsService } from './pharmacist-requests.service';
import { PharmacistRequestsController } from './pharmacist-requests.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';
import { PharmacistProfilesService } from 'src/pharmacist-profiles/pharmacist-profiles.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [PharmacistRequestsController],
  providers: [
    PharmacistRequestsService,
    UsersService,
    PharmacistProfilesService,
    FirebaseService,
    EmailService,
  ],
  imports: [PrismaModule, AuthModule],
})
export class PharmacistRequestsModule {}
