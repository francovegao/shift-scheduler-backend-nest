import { Module } from '@nestjs/common';
import { PharmacistProfilesService } from './pharmacist-profiles.service';
import { PharmacistProfilesController } from './pharmacist-profiles.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [PharmacistProfilesController],
  providers: [PharmacistProfilesService, UsersService, EmailService],
  imports: [PrismaModule, AuthModule],
})
export class PharmacistProfilesModule {}
