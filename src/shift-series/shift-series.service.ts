import { Injectable } from '@nestjs/common';
import { CreateShiftSeryDto } from './dto/create-shift-sery.dto';
import { UpdateShiftSeryDto } from './dto/update-shift-sery.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'generated/prisma';
import { fromZonedTime } from 'date-fns-tz';

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

      //find company timezone
      const company = await this.prisma.company.findUnique({
          where: { id: createShiftSeryDto.companyId },
        });
      const timezone = company?.timezone || "America/Edmonton";

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
          const dateOnly = current.toISOString().slice(0, 10);

          //Handle overnight shifts
          const shiftStart = buildUtcFromLocal(
            dateOnly,
            createShiftSeryDto.startMinutes,
            timezone
          );
          let shiftEndBase = current;

          if (createShiftSeryDto.endMinutes < createShiftSeryDto.startMinutes) {
            shiftEndBase = new Date(current);
            shiftEndBase.setDate(shiftEndBase.getDate() + 1);
          }

          const endDateString = shiftEndBase.toISOString().slice(0, 10);
          const shiftEnd = buildUtcFromLocal(
            endDateString,
            createShiftSeryDto.endMinutes,
            timezone
          );

            shifts.push({
              companyId: createShiftSeryDto.companyId,
              locationId: createShiftSeryDto.locationId ?? null,
              title: createShiftSeryDto.title,
              description: createShiftSeryDto.description ?? null,
              payRate: createShiftSeryDto.payRate,
              startTime: shiftStart,
              endTime: shiftEnd, 
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

function buildUtcFromLocal(
  dateStr: string,     
  totalMinutes: number,    
  timezone: string          
): Date {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const localDateTime = `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

  return fromZonedTime(localDateTime, timezone);
}

function parseLocalDate(dateStr: string): Date {
  const dateOnly = dateStr.split("T")[0];
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day);
}