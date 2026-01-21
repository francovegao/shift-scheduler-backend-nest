import { Injectable } from '@nestjs/common';
import { CreateShiftSeryDto } from './dto/create-shift-sery.dto';
import { UpdateShiftSeryDto } from './dto/update-shift-sery.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'generated/prisma';

@Injectable()
export class ShiftSeriesService {
  constructor(private prisma: PrismaService) {}
  
  async create(createShiftSeryDto: CreateShiftSeryDto) {
    const { status, pharmacistId, ...shiftSeriesData } = createShiftSeryDto;

    return await this.prisma.$transaction(async (tx) => {
        const series = await tx.shiftSeries.create({ 
          data: shiftSeriesData, 
        });
      const shifts: Prisma.ShiftCreateManyInput[] = [];

      let current = parseLocalDate(createShiftSeryDto.startDate);
      const endDate = parseLocalDate(createShiftSeryDto.endDate);

      current.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      while(current <= endDate){
        const day = current.getDay(); //0-6

        const isDaily = createShiftSeryDto.repeatType === "DAILY";
        const isWeekly = createShiftSeryDto.repeatType === "WEEKLY";

        const isWeekend = (day === 0 || day === 6);
        const shouldIncludeDay = isWeekly && createShiftSeryDto.daysOfWeek.includes(day);
        const isExcludedWeekend = createShiftSeryDto.excludeWeekends && isWeekend;

        if( ( isDaily || shouldIncludeDay) && !isExcludedWeekend){
          //Handle overnight shifts
          const shiftStart = buildLocalDate(current, createShiftSeryDto.startMinutes);
          let shiftEndBase = current;

          if (createShiftSeryDto.endMinutes < createShiftSeryDto.startMinutes) {
            shiftEndBase = new Date(current);
            shiftEndBase.setDate(shiftEndBase.getDate() + 1);
          }

          const shiftEnd = buildLocalDate(shiftEndBase, createShiftSeryDto.endMinutes);

            shifts.push({
              companyId: createShiftSeryDto.companyId,
              locationId: createShiftSeryDto.locationId ?? null,
              title: createShiftSeryDto.title,
              description: createShiftSeryDto.description ?? null,
              payRate: createShiftSeryDto.payRate,
              startTime: shiftStart, //setTime(shiftStart, createShiftSeryDto.startMinutes),
              endTime: shiftEnd, //setTime(shiftEnd, createShiftSeryDto.endMinutes),
              published: createShiftSeryDto.published,
              seriesId: series.id,
              status: createShiftSeryDto.status ?? 'open',
              pharmacistId: createShiftSeryDto.pharmacistId ?? null,
            });

        }

        current.setDate(current.getDate() + 1);
      }

      if (shifts.length > 0) {
        await tx.shift.createMany({ data: shifts });
      }

      return series;
    });
  }

  findAll() {
    return `This action returns all shiftSeries`;
  }

  findOne(id: number) {
    return `This action returns a #${id} shiftSery`;
  }

  update(id: number, updateShiftSeryDto: UpdateShiftSeryDto) {
    return `This action updates a #${id} shiftSery`;
  }

  remove(id: number) {
    return `This action removes a #${id} shiftSery`;
  }
}

function buildLocalDate(baseDate: Date, totalMinutes: number,): Date {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hours,
    minutes,
    0,
    0,
  );
}

function parseLocalDate(dateStr: string): Date {
  const dateOnly = dateStr.split("T")[0];
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day);
}