import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';

@Module({
  controllers: [LocationsController],
  providers: [LocationsService, UsersService],
  imports: [PrismaModule, AuthModule],
})
export class LocationsModule {}
