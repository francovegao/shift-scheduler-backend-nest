import { Module } from '@nestjs/common';
import { PharmacistProfilesService } from './pharmacist-profiles.service';
import { PharmacistProfilesController } from './pharmacist-profiles.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [PharmacistProfilesController],
  providers: [PharmacistProfilesService],
  imports: [PrismaModule],
})
export class PharmacistProfilesModule {}
