import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ShiftAssignmentsService } from './shift-assignments.service';
import { CreateShiftAssignmentDto } from './dto/create-shift-assignment.dto';
import { UpdateShiftAssignmentDto } from './dto/update-shift-assignment.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ShiftAssignmentEntity } from './entities/shift-assignment.entity';

@Controller('shift-assignments')
export class ShiftAssignmentsController {
  constructor(private readonly shiftAssignmentsService: ShiftAssignmentsService) {}

  @Post()
  @ApiCreatedResponse({ type: ShiftAssignmentEntity })
  create(@Body() createShiftAssignmentDto: CreateShiftAssignmentDto) {
    return this.shiftAssignmentsService.create(createShiftAssignmentDto);
  }

  @Get()
  @ApiOkResponse({ type: ShiftAssignmentEntity, isArray: true })
  findAll() {
    return this.shiftAssignmentsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: ShiftAssignmentEntity })
  findOne(@Param('id') id: string) {
    return this.shiftAssignmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: ShiftAssignmentEntity })
  update(@Param('id') id: string, @Body() updateShiftAssignmentDto: UpdateShiftAssignmentDto) {
    return this.shiftAssignmentsService.update(id, updateShiftAssignmentDto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: ShiftAssignmentEntity })
  remove(@Param('id') id: string) {
    return this.shiftAssignmentsService.remove(id);
  }
}
