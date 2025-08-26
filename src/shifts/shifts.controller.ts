import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ShiftEntity } from './entities/shift.entity';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';

@Controller('shifts')
@ApiTags('Shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  @ApiCreatedResponse({ type: ShiftEntity })
  create(@Body() createShiftDto: CreateShiftDto) {
    return this.shiftsService.create(createShiftDto);
  }

  @Get()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiQuery({ name: 'pharmacistId', required: false, type: String })
  @ApiOkResponse({ type: ShiftEntity, isArray: true })
  findAll(
    @Query() paginationDto: PaginationDto, 
    @Query('search') search?: string,
    @Query('locationId') locationId?: string,
    @Query('companyId') companyId?: string,
    @Query('pharmacistId') pharmacistId?: string,
  ) {
    return this.shiftsService.findAll(paginationDto, search, locationId, companyId, pharmacistId);
  }

  @Get(':id')
  @ApiOkResponse({ type: ShiftEntity })
  findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(id);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: ShiftEntity })
  update(@Param('id') id: string, @Body() updateShiftDto: UpdateShiftDto) {
    return this.shiftsService.update(id, updateShiftDto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: ShiftEntity })
  remove(@Param('id') id: string) {
    return this.shiftsService.remove(id);
  }
}
