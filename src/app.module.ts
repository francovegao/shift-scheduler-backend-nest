import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { ShiftsModule } from './shifts/shifts.module';
import { LocationsModule } from './locations/locations.module';
import { PharmacistProfilesModule } from './pharmacist-profiles/pharmacist-profiles.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [PrismaModule, UsersModule, CompaniesModule, ShiftsModule, LocationsModule, PharmacistProfilesModule, AuthModule, NotificationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
