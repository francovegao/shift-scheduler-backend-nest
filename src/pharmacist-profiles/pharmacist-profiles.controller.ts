import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PharmacistProfilesService } from './pharmacist-profiles.service';
import { CreatePharmacistProfileDto } from './dto/create-pharmacist-profile.dto';
import { UpdatePharmacistProfileDto } from './dto/update-pharmacist-profile.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PharmacistProfileEntity } from './entities/pharmacist-profile.entity';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { NotifyUsersDto } from 'src/email/dto/notify-users.dto';

@Controller('pharmacist-profiles')
@ApiTags('Pharmacist Profiles')
export class PharmacistProfilesController {
  constructor(
    private readonly pharmacistProfilesService: PharmacistProfilesService,
  ) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: PharmacistProfileEntity })
  create(@Body() createPharmacistProfileDto: CreatePharmacistProfileDto) {
    return this.pharmacistProfilesService.create(createPharmacistProfileDto);
  }

  @Post('/notify-open-shifts')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: String })
  notifyOpenShifts(@Body() notifyUsersDto: NotifyUsersDto) {
    return this.pharmacistProfilesService.notifyOpenShifts(notifyUsersDto);
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PharmacistProfileEntity, isArray: true })
  findAll() {
    return this.pharmacistProfilesService.findAll();
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PharmacistProfileEntity })
  findOne(@Param('id') id: string) {
    return this.pharmacistProfilesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: PharmacistProfileEntity })
  update(
    @CurrentUser() currentUser,
    @Param('id') id: string,
    @Body() updatePharmacistProfileDto: UpdatePharmacistProfileDto,
  ) {
    return this.pharmacistProfilesService.update(
      currentUser,
      id,
      updatePharmacistProfileDto,
    );
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PharmacistProfileEntity })
  remove(@Param('id') id: string) {
    return this.pharmacistProfilesService.remove(id);
  }
}
