/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ShiftWorkLogsService } from './shift-work-logs.service';
import { CreateShiftWorkLogDto } from './dto/create-shift-work-log.dto';
import { UpdateShiftWorkLogDto } from './dto/update-shift-work-log.dto';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { UpsertWorkLogDto } from './dto/upsert-shift-work-log.dto';

@Controller('shift-work-logs')
export class ShiftWorkLogsController {
  constructor(private readonly shiftWorkLogsService: ShiftWorkLogsService) {}

  @Post('/admin-upsert')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { success: { type: 'boolean' } },
    },
  })
  upsertWorkLog(@Body() upsertWorkLogDto: UpsertWorkLogDto) {
    return this.shiftWorkLogsService.upsertWorkLog(upsertWorkLogDto);
  }

  @Post()
  create(@Body() createShiftWorkLogDto: CreateShiftWorkLogDto) {
    return this.shiftWorkLogsService.create(createShiftWorkLogDto);
  }

  @Get()
  findAll() {
    return this.shiftWorkLogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftWorkLogsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateShiftWorkLogDto: UpdateShiftWorkLogDto,
  ) {
    return this.shiftWorkLogsService.update(+id, updateShiftWorkLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shiftWorkLogsService.remove(+id);
  }
}
