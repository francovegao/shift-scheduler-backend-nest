import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ShiftSeriesService } from './shift-series.service';
import { CreateShiftSeryDto } from './dto/create-shift-sery.dto';
import { UpdateShiftSeryDto } from './dto/update-shift-sery.dto';
import { ApiTags, ApiBearerAuth, ApiCreatedResponse } from '@nestjs/swagger';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { ShiftSery } from './entities/shift-sery.entity';


@Controller('shift-series')
@ApiTags('Shift-series')
export class ShiftSeriesController {
  constructor(private readonly shiftSeriesService: ShiftSeriesService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: ShiftSery })
  create(@Body() createShiftSeryDto: CreateShiftSeryDto) {
    return this.shiftSeriesService.create(createShiftSeryDto);
  }

  @Get()
  findAll() {
    return this.shiftSeriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftSeriesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShiftSeryDto: UpdateShiftSeryDto) {
    return this.shiftSeriesService.update(+id, updateShiftSeryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shiftSeriesService.remove(+id);
  }
}
