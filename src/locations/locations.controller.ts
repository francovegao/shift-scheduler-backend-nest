import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LocationEntity } from './entities/location.entity';

@Controller('locations')
@ApiTags('Locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @ApiCreatedResponse({ type: LocationEntity })
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationsService.create(createLocationDto);
  }

  @Get()
  @ApiOkResponse({ type: LocationEntity, isArray: true })
  findAll() {
    return this.locationsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: LocationEntity })
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: LocationEntity })
  update(@Param('id') id: string, @Body() updateLocationDto: UpdateLocationDto) {
    return this.locationsService.update(id, updateLocationDto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: LocationEntity })
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }
}
