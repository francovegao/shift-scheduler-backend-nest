import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PharmacistProfilesService } from './pharmacist-profiles.service';
import { CreatePharmacistProfileDto } from './dto/create-pharmacist-profile.dto';
import { UpdatePharmacistProfileDto } from './dto/update-pharmacist-profile.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PharmacistProfileEntity } from './entities/pharmacist-profile.entity';

@Controller('pharmacist-profiles')
@ApiTags('Pharmacist Profiles')
export class PharmacistProfilesController {
  constructor(private readonly pharmacistProfilesService: PharmacistProfilesService) {}

  @Post()
  @ApiCreatedResponse({ type: PharmacistProfileEntity })
  create(@Body() createPharmacistProfileDto: CreatePharmacistProfileDto) {
    return this.pharmacistProfilesService.create(createPharmacistProfileDto);
  }

  @Get()
  @ApiOkResponse({ type: PharmacistProfileEntity, isArray: true })
  findAll() {
    return this.pharmacistProfilesService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: PharmacistProfileEntity })
  findOne(@Param('id') id: string) {
    return this.pharmacistProfilesService.findOne(id);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: PharmacistProfileEntity })
  update(@Param('id') id: string, @Body() updatePharmacistProfileDto: UpdatePharmacistProfileDto) {
    return this.pharmacistProfilesService.update(id, updatePharmacistProfileDto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: PharmacistProfileEntity })
  remove(@Param('id') id: string) {
    return this.pharmacistProfilesService.remove(id);
  }
}
