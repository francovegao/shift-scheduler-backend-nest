import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ShiftEntity } from './entities/shift.entity';

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
  @ApiOkResponse({ type: ShiftEntity, isArray: true })
  findAll() {
    return this.shiftsService.findAll();
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
