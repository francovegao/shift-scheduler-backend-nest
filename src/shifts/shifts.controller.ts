import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ShiftEntity } from './entities/shift.entity';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';

@Controller('shifts')
@ApiTags('Shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: ShiftEntity })
  create(@Body() createShiftDto: CreateShiftDto) {
    return this.shiftsService.create(createShiftDto);
  }

 
  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiQuery({ name: 'pharmacistId', required: false, type: String })
  @ApiQuery({ name: 'shiftId', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'minRate', required: false, type: String })
  @ApiQuery({ name: 'maxRate', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  @ApiOkResponse({ type: ShiftEntity, isArray: true })
  findAll(
    @CurrentUser() currentUser,
    @Query() paginationDto: PaginationDto, 
    @Query('search') search?: string,
    @Query('locationId') locationId?: string,
    @Query('companyId') companyId?: string,
    @Query('pharmacistId') pharmacistId?: string,
    @Query('shiftId') shiftId?: string,
    @Query('from') fromDate?: Date,
    @Query('to') toDate?: Date,
    @Query('minRate') minRate?: string,
    @Query('maxRate') maxRate?: string,
    @Query('status') selectedStatus?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: "asc" | "desc",
  ) {
    return this.shiftsService.findAll(currentUser, paginationDto, search, 
      locationId, companyId, pharmacistId, shiftId, fromDate, toDate,
       minRate, maxRate, selectedStatus, sortBy, sortOrder);
  }

  @Get('/myshifts')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'shiftId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiOkResponse({ type: ShiftEntity })
  findPharmacistShifts(
    @CurrentUser() currentUser,
    @Query() paginationDto: PaginationDto, 
    @Query('search') search?: string,
    @Query('shiftId') shiftId?: string,
    @Query('status') selectedStatus?: string,
    @Query('from') fromDate?: Date,
    @Query('to') toDate?: Date,
  ) {
    return this.shiftsService.findPharmacistShifts(currentUser, paginationDto, search, shiftId, selectedStatus, fromDate, toDate);
  }

  @Get('/allmyshifts')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ShiftEntity })
  findAllUserShifts(
    @CurrentUser() currentUser,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.shiftsService.findAllUserShifts(currentUser, paginationDto);
  }


  @Get('/date')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiOkResponse({ type: ShiftEntity, isArray: true })
  findShiftsByDate(
    @CurrentUser() currentUser,
    @Query() paginationDto: PaginationDto, 
    @Query('date') date?: string,
  ) {
    return this.shiftsService.findShiftsByDate(currentUser, paginationDto, date);
  }

  @Get('/latest')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ShiftEntity, isArray: true })
  findLatestShifts(
    @CurrentUser() currentUser,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.shiftsService.findLatestShifts(currentUser, paginationDto);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ShiftEntity })
  findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: ShiftEntity })
  update(@Param('id') id: string, @Body() updateShiftDto: UpdateShiftDto) {
    return this.shiftsService.update(id, updateShiftDto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ShiftEntity })
  remove(@Param('id') id: string) {
    return this.shiftsService.remove(id);
  }
}
