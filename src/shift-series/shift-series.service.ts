/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateShiftSeryDto } from './dto/create-shift-sery.dto';
import { UpdateShiftSeryDto } from './dto/update-shift-sery.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { DeleteShiftSeriesDto } from './dto/delete-shift-sery.dto';
import { ShiftsService } from 'src/shifts/shifts.service';
import { EmailService } from 'src/email/email.service';
import { AppEvents } from 'src/events/app-events';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ShiftSeriesService {
  constructor(
    private prisma: PrismaService,
    private shiftsService: ShiftsService,
    private emailService: EmailService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createShiftSeryDto: CreateShiftSeryDto) {
    const { status, pharmacistId, ...shiftSeriesData } = createShiftSeryDto;

    const { shiftSeries, createdShifts, accumulatedDates } =
      await this.prisma.$transaction(async (tx) => {
        const shiftSeries = await tx.shiftSeries.create({
          data: shiftSeriesData,
        });
        const shifts: Prisma.ShiftCreateManyInput[] = [];
        const accumulatedDates: string[] = [];

        //find company timezone
        const company = await this.prisma.company.findUnique({
          where: { id: createShiftSeryDto.companyId },
        });
        const timezone = company?.timezone || 'America/Edmonton';

        const current = parseLocalDate(createShiftSeryDto.startDate);
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

            if (
              createShiftSeryDto.endMinutes < createShiftSeryDto.startMinutes
            ) {
              shiftEndBase = new Date(current);
              shiftEndBase.setDate(shiftEndBase.getDate() + 1);
            }

            const endDateString = shiftEndBase.toISOString().slice(0, 10);
            const shiftEnd = buildUtcFromLocal(
              endDateString,
              createShiftSeryDto.endMinutes,
              timezone,
            );

            //If shift is taken find if one of the shifts included in the series overlaps
            if (
              createShiftSeryDto.status === 'taken' &&
              createShiftSeryDto?.pharmacistId
            ) {
              const overlappingShift = await this.prisma.shift.findFirst({
                where: {
                  pharmacistId: createShiftSeryDto.pharmacistId,
                  startTime: {
                    lt: shiftEnd,
                  },
                  endTime: {
                    gt: shiftEnd,
                  },
                },
              });

              if (overlappingShift) {
                throw new ForbiddenException(
                  `A shift for the assigned pharmacist already exists on ${dateOnly}.`,
                );
              }
            }

            shifts.push({
              companyId: createShiftSeryDto.companyId,
              locationId: createShiftSeryDto.locationId ?? null,
              title: createShiftSeryDto.title,
              description: createShiftSeryDto.description ?? null,
              payRate: createShiftSeryDto.payRate,
              startTime: shiftStart,
              endTime: shiftEnd,
              published: createShiftSeryDto.published,
              seriesId: shiftSeries.id,
              status: createShiftSeryDto.status ?? 'open',
              pharmacistId: createShiftSeryDto.pharmacistId ?? null,
            });

            accumulatedDates.push(dateOnly);
          }

          current.setDate(current.getDate() + 1);
        }

        let createdShifts: any[] = [];

        if (shifts.length > 0) {
          createdShifts = await tx.shift.createManyAndReturn({
            data: shifts,
            include: {
              company: {
                select: {
                  name: true,
                  timezone: true,
                  address: true,
                  city: true,
                  province: true,
                },
              },
              pharmacist: {
                select: {
                  user: {
                    select: {
                      email: true,
                      firstName: true,
                    },
                  },
                },
              },
            },
          });
        }

        return { shiftSeries, createdShifts, accumulatedDates };
      });

    const sampleShift = createdShifts[0];

    //Notify if shift was assigned to a pharmacist
    if (sampleShift.status === 'taken' && sampleShift.pharmacistId) {
      //emit event for notifications
      this.eventEmitter.emit(AppEvents.MULTIPLE_SHIFTS_TAKEN, {
        shift: sampleShift,
        shiftsDates: accumulatedDates,
      });

      const pharmacistProfile = await this.prisma.pharmacistProfile.findUnique({
        where: { id: sampleShift.pharmacistId },
        select: {
          user: {
            select: { email: true },
          },
        },
      });

      if (pharmacistProfile?.user?.email) {
        // Send a SINGLE email containing shifts info
        this.emailService.emailPharmacistMultipleShiftsAssigned(
          pharmacistProfile.user.email,
          sampleShift,
          accumulatedDates,
        );
      }
    }

    return shiftSeries;
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

    const timeZone = referenceShift.company.timezone;

    if (updateShiftSeryDto.shiftData.startTime === undefined) {
      throw new BadRequestException('Start Time is required');
    }
    if (updateShiftSeryDto.shiftData.endTime === undefined) {
      throw new BadRequestException('End Time is required');
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

    //If shift is taken, check shift does not overlaps
    const takingShift = updateShiftSeryDto.shiftData?.status === 'taken';
    const assignedPharmacist = updateShiftSeryDto.shiftData?.pharmacistId;

    const preparedShifts: Array<{
      shiftId: string;
      startUtc: Date;
      endUtc: Date;
      companyId: string;
      originalPharmacistId: string | null;
    }> = [];
    const dbOverlapConditions: Prisma.ShiftWhereInput[] = [];

    for (const shift of shifts) {
      const zonedStart = toZonedTime(shift.startTime, timeZone);
      const zonedEnd = toZonedTime(shift.endTime, timeZone);

      const [startHours, startMinutes] =
        updateShiftSeryDto.shiftData.startTime.split(':');
      const [endHours, endMinutes] =
        updateShiftSeryDto.shiftData.endTime.split(':');

      zonedStart.setHours(
        parseInt(startHours, 10),
        parseInt(startMinutes, 10),
        0,
        0,
      );
      zonedEnd.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10), 0, 0);

      //If Overnight shift
      if (
        parseInt(endHours, 10) * 60 + parseInt(endMinutes, 10) <
        parseInt(startHours, 10) * 60 + parseInt(startMinutes, 10)
      ) {
        zonedEnd.setDate(zonedEnd.getDate() + 1);
      }

      const startUtc = fromZonedTime(zonedStart, timeZone);
      const endUtc = fromZonedTime(zonedEnd, timeZone);

      preparedShifts.push({
        shiftId: shift.id,
        startUtc,
        endUtc,
        companyId: shift.companyId,
        originalPharmacistId: shift.pharmacistId,
      });

      if (takingShift && assignedPharmacist) {
        dbOverlapConditions.push({
          NOT: { id: shift.id },
          startTime: { lt: endUtc },
          endTime: { gt: startUtc },
        });
      }
    }

    if (dbOverlapConditions.length > 0) {
      const overlappingShift = await this.prisma.shift.findFirst({
        where: {
          pharmacistId: assignedPharmacist,
          OR: dbOverlapConditions,
        },
      });

      if (overlappingShift) {
        throw new ForbiddenException(
          'A shift for the assigned pharmacist already exists in the same time slot as one of the updating shifts in the series.',
        );
      }
    }

    const updatedShifts: any[] = [];
    const newlyAssignedShifts: any[] = [];
    const regularUpdatedShifts: any[] = [];

    for (const preparedShift of preparedShifts) {
      const updated = await this.shiftsService.update(
        preparedShift.shiftId,
        {
          ...updateShiftSeryDto.shiftData,
          startTime: preparedShift.startUtc.toISOString(),
          endTime: preparedShift.endUtc.toISOString(),
          companyId: preparedShift.companyId,
        },
        true,
      );

      if (updated.status === 'taken' && updated.pharmacistId) {
        if (preparedShift.originalPharmacistId !== updated.pharmacistId) {
          newlyAssignedShifts.push(updated);
        } else {
          regularUpdatedShifts.push(updated);
        }
      }

      updatedShifts.push(updated);
    }

    //Send emails for newly assigned shifts
    if (newlyAssignedShifts.length > 0) {
      const assignedEmails = [
        ...new Set(newlyAssignedShifts.map((s) => s.pharmacist?.user.email)),
      ].filter(Boolean);

      if (assignedEmails.length > 0) {
        this.emailService.emailPharmacistsShiftSeriesAssigned(
          assignedEmails,
          newlyAssignedShifts,
        );
      }
    }

    if (regularUpdatedShifts.length > 0) {
      const updateEmails = [
        ...new Set(regularUpdatedShifts.map((s) => s.pharmacist?.user.email)),
      ].filter(Boolean);

      if (updateEmails.length > 0) {
        this.emailService.emailPharmacistsShiftSeriesUpdated(
          updateEmails,
          regularUpdatedShifts,
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
