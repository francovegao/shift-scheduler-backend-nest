import { Injectable } from '@nestjs/common';
import { CreateShiftSeryDto } from './dto/create-shift-sery.dto';
import { UpdateShiftSeryDto } from './dto/update-shift-sery.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { DeleteShiftSeriesDto } from './dto/delete-shift-sery.dto';
import { ShiftsService } from 'src/shifts/shifts.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class ShiftSeriesService {
  constructor(
    private prisma: PrismaService,
    private shiftsService: ShiftsService,
    private emailService: EmailService,
  ) {}

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
      const timezone = company?.timezone || 'America/Edmonton';

      let current = parseLocalDate(createShiftSeryDto.startDate);
      const endDate = parseLocalDate(createShiftSeryDto.endDate);

      current.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      while (current <= endDate) {
        const day = current.getDay(); //0-6

        const isDaily = createShiftSeryDto.repeatType === 'DAILY';
        const isWeekly = createShiftSeryDto.repeatType === 'WEEKLY';

        const isWeekend = day === 0 || day === 6;
        const shouldIncludeDay =
          isWeekly && createShiftSeryDto.daysOfWeek.includes(day);
        const isExcludedWeekend =
          createShiftSeryDto.excludeWeekends && isWeekend;

        if ((isDaily || shouldIncludeDay) && !isExcludedWeekend) {
          const dateOnly = current.toISOString().slice(0, 10);

          //Handle overnight shifts
          const shiftStart = buildUtcFromLocal(
            dateOnly,
            createShiftSeryDto.startMinutes,
            timezone,
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
            timezone,
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

  async update(id: string, updateShiftSeryDto: UpdateShiftSeryDto) {
    //find reference Shift
    const referenceShift = await this.prisma.shift.findUnique({
      where: { id: updateShiftSeryDto.shiftSeriesData.referenceShiftId },
      include: {
        company: {
          select: {
            timezone: true,
          },
        },
      },
    });

    if (!referenceShift) {
      throw new Error('Reference Shift not found');
    }

    //Check if start and end time are being updated
    const timeZone = referenceShift.company.timezone;
    const zonedStartTime = toZonedTime(referenceShift.startTime, timeZone);
    const zonedEndTime = toZonedTime(referenceShift.endTime, timeZone);

    const referenceStartMinutes =
      zonedStartTime.getHours() * 60 + zonedStartTime.getMinutes();
    const referenceEndMinutes =
      zonedEndTime.getHours() * 60 + zonedEndTime.getMinutes();

    //If no change in minutes remove startTime and endTime from updateShiftDto
    if (updateShiftSeryDto.shiftData.startTime !== undefined) {
      const [hours, minutes] =
        updateShiftSeryDto.shiftData.startTime.split(':');
      const incomingMinutes = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
      if (referenceStartMinutes === incomingMinutes) {
        delete updateShiftSeryDto.shiftData.startTime;
      }
    }
    if (updateShiftSeryDto.shiftData.endTime !== undefined) {
      const [hours, minutes] = updateShiftSeryDto.shiftData.endTime.split(':');
      const incomingMinutes = parseInt(hours, 10) * 60 + parseInt(minutes, 10);

      if (referenceEndMinutes === incomingMinutes) {
        delete updateShiftSeryDto.shiftData.endTime;
      }
    }

    const whereFilter: Prisma.ShiftWhereInput =
      updateShiftSeryDto.shiftSeriesData.scope === 'future'
        ? {
            seriesId: id,
            status: { notIn: ['completed', 'cancelled'] },
            startTime: { gte: referenceShift.startTime },
          }
        : {
            seriesId: id,
            status: { notIn: ['completed', 'cancelled'] },
            startTime: { gte: new Date() },
          };

    const shifts = await this.prisma.shift.findMany({
      where: whereFilter,
    });

    const updatedShifts: any[] = [];

    for (const shift of shifts) {
      let newStartTime = shift.startTime;
      let newEndTime = shift.endTime;

      if (updateShiftSeryDto.shiftData.startTime !== undefined) {
        const zonedStart = toZonedTime(shift.startTime, timeZone);

        const [hours, minutes] =
          updateShiftSeryDto.shiftData.startTime.split(':');

        zonedStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        newStartTime = zonedStart;
      }

      if (updateShiftSeryDto.shiftData.endTime !== undefined) {
        const zonedEnd = toZonedTime(shift.endTime, timeZone);

        const [hours, minutes] =
          updateShiftSeryDto.shiftData.endTime.split(':');

        zonedEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        newEndTime = zonedEnd;
      }

      //If Overnight shift
      if (
        updateShiftSeryDto.shiftData.endTime !== undefined &&
        updateShiftSeryDto.shiftData.startTime !== undefined
      ) {
        if (
          updateShiftSeryDto.shiftData.endTime <
          updateShiftSeryDto.shiftData.startTime
        ) {
          newEndTime.setDate(newEndTime.getDate() + 1);
        }
      }

      const updated = await this.shiftsService.update(
        shift.id,
        {
          ...updateShiftSeryDto.shiftData,
          startTime: newStartTime.toISOString(),
          endTime: newEndTime.toISOString(),
          companyId: shift.companyId,
        },
        true,
      );

      updatedShifts.push(updated);
    }

    const updatedAssignedShifts = updatedShifts.filter(
      (s) => s.status === 'taken' && s.pharmacistId,
    );

    if (updatedAssignedShifts.length > 0) {
      const pharmacistsEmailsToNotify = [
        ...new Set(updatedAssignedShifts.map((s) => s.pharmacist?.user.email)),
      ].filter(Boolean);

      if (pharmacistsEmailsToNotify.length > 0) {
        this.emailService.emailPharmacistsShiftSeriesUpdated(
          pharmacistsEmailsToNotify,
          updatedAssignedShifts,
        );
      }
    }

    return updatedShifts;
  }

  async remove(id: string, deleteShiftSeriesDto: DeleteShiftSeriesDto) {
    //find reference Shift
    const referenceShift = await this.prisma.shift.findUnique({
      where: { id: deleteShiftSeriesDto.referenceShiftId },
    });

    if (!referenceShift) {
      throw new Error('Reference Shift not found');
    }

    const deleteFilter: Prisma.ShiftWhereInput = {
      seriesId: id,
      startTime: {
        gte:
          deleteShiftSeriesDto.scope === 'future'
            ? referenceShift.startTime
            : new Date(),
      },
      status: {
        notIn: ['completed', 'cancelled'],
      },
    };

    const assignedShifts = await this.prisma.shift.findMany({
      where: {
        ...deleteFilter,
        status: 'taken',
        pharmacistId: { not: null },
      },
      include: {
        company: {
          select: {
            name: true,
            timezone: true,
            contactName: true,
            contactEmail: true,
          },
        },
        pharmacist: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    //Delete shifts
    await this.prisma.shift.deleteMany({
      where: deleteFilter,
    });

    //Notify pharmacists
    const pharmacistsEmailsToNotify = [
      ...new Set(
        assignedShifts
          .map((s) => s.pharmacist?.user.email)
          .filter((email): email is string => !!email),
      ),
    ];

    if (pharmacistsEmailsToNotify.length > 0) {
      this.emailService.emailPharmacistsShiftSeriesCancelled(
        pharmacistsEmailsToNotify,
        assignedShifts,
      );
    }

    //Check if shiftSeries is empty
    const shiftSerie = await this.prisma.shiftSeries.findUnique({
      where: { id },
      include: {
        shifts: true,
      },
    });

    if (shiftSerie?.shifts.length === 0) {
      await this.prisma.shiftSeries.delete({
        where: { id },
      });
    }

    return shiftSerie;
  }
}

function buildUtcFromLocal(
  dateStr: string,
  totalMinutes: number,
  timezone: string,
): Date {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const localDateTime = `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

  return fromZonedTime(localDateTime, timezone);
}

function parseLocalDate(dateStr: string): Date {
  const dateOnly = dateStr.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}
