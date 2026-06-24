import { Injectable } from '@nestjs/common';
import { CreateShiftWorkLogDto } from './dto/create-shift-work-log.dto';
import { UpdateShiftWorkLogDto } from './dto/update-shift-work-log.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ShiftWorkLogsService {
  constructor(private prisma: PrismaService) {}

  create(createShiftWorkLogDto: CreateShiftWorkLogDto) {
    return 'This action adds a new shiftWorkLog';
  }

  findAll() {
    return `This action returns all shiftWorkLogs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} shiftWorkLog`;
  }

  update(id: number, updateShiftWorkLogDto: UpdateShiftWorkLogDto) {
    return `This action updates a #${id} shiftWorkLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} shiftWorkLog`;
  }
}
