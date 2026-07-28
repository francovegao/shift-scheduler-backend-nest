import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateShiftWorkLogDto } from './dto/create-shift-work-log.dto';
import { UpdateShiftWorkLogDto } from './dto/update-shift-work-log.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpsertWorkLogDto } from './dto/upsert-shift-work-log.dto';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { addDays } from 'date-fns';

@Injectable()
export class ShiftWorkLogsService {
  constructor(private prisma: PrismaService) {}

  async upsertWorkLog(upsertWorkLogDto: UpsertWorkLogDto) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: upsertWorkLogDto.shiftId },
      select: {
        id: true,
        startTime: true,
        company: { select: { timezone: true } },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    const timezone = shift.company.timezone;

    const targetDateStr = formatInTimeZone(
      new Date(shift.startTime),
      timezone,
      'yyyy-MM-dd',
    );

    const startHH = String(
      Math.floor(upsertWorkLogDto.startMinutes / 60),
    ).padStart(2, '0');
    const startMM = String(upsertWorkLogDto.startMinutes % 60).padStart(2, '0');
    const endHH = String(Math.floor(upsertWorkLogDto.endMinutes / 60)).padStart(
      2,
      '0',
    );
    const endMM = String(upsertWorkLogDto.endMinutes % 60).padStart(2, '0');

    const startUtc = fromZonedTime(
      `${targetDateStr}T${startHH}:${startMM}:00`,
      timezone,
    );
    let endUtc = fromZonedTime(
      `${targetDateStr}T${endHH}:${endMM}:00`,
      timezone,
    );

    if (upsertWorkLogDto.endMinutes < upsertWorkLogDto.startMinutes) {
      endUtc = addDays(endUtc, 1);
    }

    const diffInMilliseconds = endUtc.getTime() - startUtc.getTime();
    const durationHours =
      Math.round((diffInMilliseconds / (1000 * 60 * 60)) * 100) / 100;

    if (upsertWorkLogDto.id) {
      await this.prisma.shiftWorkLog.update({
        where: { id: upsertWorkLogDto.id },
        data: {
          clockIn: startUtc,
          clockOut: endUtc,
          durationHours,
          isModified: true,
        },
      });
    } else {
      await this.prisma.shiftWorkLog.create({
        data: {
          shiftId: upsertWorkLogDto.shiftId,
          pharmacistId: upsertWorkLogDto.pharmacistId,
          clockIn: startUtc,
          clockOut: endUtc,
          durationHours,
          isModified: true,
        },
      });
    }

    return { success: true };
  }

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
