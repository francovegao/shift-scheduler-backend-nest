import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppEvents } from 'src/events/app-events';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(private prisma: PrismaService) {}

//   @OnEvent(AppEvents.SHIFT_CREATED)
//   async handleShiftCreatedEvent(payload: any) {
//     const { shift } = payload;
//     this.logger.log(`New shift created: ${shift.title}`);

//     // Find eligible pharmacists (example logic)
//     const pharmacists = await this.prisma.pharmacistProfile.findMany({
//       where: {
//         OR: [
//           { canViewAllCompanies: true },
//           { allowedCompanies: { some: { id: shift.companyId } } },
//         ],
//       },
//       select: { userId: true },
//     });

//     if (!pharmacists.length) return;

//     await this.prisma.notification.createMany({
//       data: pharmacists.map((p) => ({
//         userId: p.userId,
//         title: 'New shift available',
//         message: `A new shift "${shift.title}" has been created.`,
//         type: 'shift',
//       })),
//     });
//   }

  @OnEvent(AppEvents.SHIFT_TAKEN)
  async handleShiftTakenEvent(payload: any) {
    const { shift } = payload;
    this.logger.log(`Shift taken: ${shift.id}`);

    const {formattedDate, formattedStartTime, formattedEndTime, tzAbbr}  = await getFormattedDateAndTime(this.prisma, shift);

    // Notify Pharmacist
    const user = await this.prisma.pharmacistProfile.findUnique({
        where: { id: shift.pharmacistId },
        select: { userId: true},
        });

    if(user){
        await this.prisma.notification.create({
        data: {
            userId: user.userId,
            title: 'Shift Scheduled',
            message: `You have a new scheduled shift: "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} ${tzAbbr}.`,
            type: 'shift',
            actionUrl: `${shift.id}`,
        }
    });
    }

    // Notify managers of the location
    const locationManagers = await this.prisma.user.findMany({
      where: {
        locationId: shift.locationId,
        role: 'location_manager',
      },
      select: { id: true },
    });

    if(locationManagers.length){
          await this.prisma.notification.createMany({
            data: locationManagers.map((m) => ({
              userId: m.id,
              title: 'Shift Taken',
              message: `A pharmacist has taken the shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} ${tzAbbr}.`,
              type: 'shift',
              actionUrl: `${shift.id}`,
            })),
          });
    }

    // Notify managers of the company
    const managers = await this.prisma.user.findMany({
      where: {
        role: 'pharmacy_manager',
        OR: [
          { companyId: shift.companyId },
          { allowedCompanies: { some: { id: shift.companyId } } },
        ]
      },
      select: { id: true },
    });

    if (!managers.length) return;

    await this.prisma.notification.createMany({
      data: managers.map((m) => ({
        userId: m.id,
        title: 'Shift Taken',
        message: `A pharmacist has taken the shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} ${tzAbbr} Pharmacy: ${shift?.company?.name}.`,
        type: 'shift',
        actionUrl: `${shift.id}`,
      })),
    });
  }

  @OnEvent(AppEvents.SHIFT_CANCELLED)
  async handleShiftCancelledEvent(payload: any) {
    const { shift } = payload;
    this.logger.log(`Shift cancelled: ${shift.id}`);

    const {formattedDate, formattedStartTime, formattedEndTime, tzAbbr}  = await getFormattedDateAndTime(this.prisma, shift);

    // Notify Pharmacist
    if(shift.pharmacistId){
      const user = await this.prisma.pharmacistProfile.findUnique({
          where: { id: shift.pharmacistId },
          select: { userId: true},
          });

      if(user){
          await this.prisma.notification.create({
          data: {
              userId: user.userId,
              title: 'Shift Cancelled',
              message: `The shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} ${tzAbbr} has been cancelled.`,
              type: 'shift',
              actionUrl: `${shift.id}`,
          }
      });
      }
    }

    // Notify managers of the location
    const locationManagers = await this.prisma.user.findMany({
      where: {
        locationId: shift.locationId,
        role: 'location_manager',
      },
      select: { id: true },
    });

    if(locationManagers.length){
          await this.prisma.notification.createMany({
            data: locationManagers.map((m) => ({
              userId: m.id,
              title: 'Shift Taken',
              message: `A pharmacist has taken the shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} ${tzAbbr}.`,
              type: 'shift',
              actionUrl: `${shift.id}`,
            })),
          });
    }

    // Notify managers of the company
    const managers = await this.prisma.user.findMany({
      where: {
        role: 'pharmacy_manager',
        OR: [
          { companyId: shift.companyId },
          { allowedCompanies: { some: { id: shift.companyId } } },
        ]
      },
      select: { id: true },
    });

    if (!managers.length) return;

    await this.prisma.notification.createMany({
      data: managers.map((m) => ({
        userId: m.id,
        title: 'Shift Cancelled',
        message: `The shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} ${tzAbbr} Pharmacy: ${shift?.company?.name} has been cancelled.`,
        type: 'shift',
        actionUrl: `${shift.id}`,
      })),
    });
  }

  @OnEvent(AppEvents.SHIFT_COMPLETED)
  async handleShiftCompletedEvent(payload: any) {
    const { shift } = payload;
    this.logger.log(`Shift completed: ${shift.id}`);

    const {formattedDate, formattedStartTime, formattedEndTime, tzAbbr}  = await getFormattedDateAndTime(this.prisma, shift);

    // Notify Pharmacist
    if(shift.pharmacistId){
      const user = await this.prisma.pharmacistProfile.findUnique({
          where: { id: shift.pharmacistId },
          select: { userId: true},
          });

      if(user){
          await this.prisma.notification.create({
          data: {
              userId: user.userId,
              title: 'Shift Completed',
              message: `The shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} ${tzAbbr} has been completed.`,
              type: 'shift',
              actionUrl: `${shift.id}`,
          }
      });
      }
    }

    // Notify managers of the location
    const locationManagers = await this.prisma.user.findMany({
      where: {
        locationId: shift.locationId,
        role: 'location_manager',
      },
      select: { id: true },
    });

    if(locationManagers.length){
          await this.prisma.notification.createMany({
            data: locationManagers.map((m) => ({
              userId: m.id,
              title: 'Shift Taken',
              message: `A pharmacist has taken the shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} ${tzAbbr} .`,
              type: 'shift',
              actionUrl: `${shift.id}`,
            })),
          });
    }

    // Notify managers of the company
    const managers = await this.prisma.user.findMany({
      where: {
        role: 'pharmacy_manager',
        OR: [
          { companyId: shift.companyId },
          { allowedCompanies: { some: { id: shift.companyId } } },
        ]
      },
      select: { id: true },
    });

    if (!managers.length) return;

    await this.prisma.notification.createMany({
      data: managers.map((m) => ({
        userId: m.id,
        title: 'Shift Completed',
        message: `The shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} ${tzAbbr} Pharmacy: ${shift?.company?.name} has been completed.`,
        type: 'shift',
        actionUrl: `${shift.id}`,
      })),
    });
  }
}

async function getFormattedDateAndTime(
    prisma: PrismaService,
    shift: {
      startTime: Date;
      endTime: Date;
      companyId: string;
    }
) {

    const company = await prisma.company.findUnique({
      where: { id: shift.companyId },
      select: { timezone: true },
    });

    const timezone = company?.timezone ?? "America/Edmonton";

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: timezone,
    });

    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    });

    const tzAbbr = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    }).formatToParts(shift.startTime)
      .find(p => p.type === 'timeZoneName')?.value;

  return {
    formattedDate: dateFormatter.format(shift.startTime),
    formattedStartTime: timeFormatter.format(shift.startTime),
    formattedEndTime: timeFormatter.format(shift.endTime),
    tzAbbr,
  };
}
