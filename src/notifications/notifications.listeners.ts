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

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };

    const formattedDate = shift.startTime.toLocaleDateString('en-US', dateOptions); 
    const formattedStartTime = shift.startTime.toLocaleTimeString('en-US', timeOptions);
    const formattedEndTime = shift.endTime.toLocaleTimeString('en-US', timeOptions);

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
            message: `You have a new scheduled shift: "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} .`,
            type: 'shift',
            actionUrl: `${shift.id}`,
        }
    });
    }

    // Notify managers of the company
    const managers = await this.prisma.user.findMany({
      where: {
        companyId: shift.companyId,
        role: 'pharmacy_manager',
      },
      select: { id: true },
    });

    if (!managers.length) return;

    await this.prisma.notification.createMany({
      data: managers.map((m) => ({
        userId: m.id,
        title: 'Shift Taken',
        message: `A pharmacist has taken the shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} .`,
        type: 'shift',
        actionUrl: `${shift.id}`,
      })),
    });
  }

  @OnEvent(AppEvents.SHIFT_CANCELLED)
  async handleShiftCancelledEvent(payload: any) {
    const { shift } = payload;
    this.logger.log(`Shift cancelled: ${shift.id}`);

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };

    const formattedDate = shift.startTime.toLocaleDateString('en-US', dateOptions); 
    const formattedStartTime = shift.startTime.toLocaleTimeString('en-US', timeOptions);
    const formattedEndTime = shift.endTime.toLocaleTimeString('en-US', timeOptions);

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
              message: `The shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} has been cancelled.`,
              type: 'shift',
              actionUrl: `${shift.id}`,
          }
      });
      }
    }

    // Notify managers of the company
    const managers = await this.prisma.user.findMany({
      where: {
        companyId: shift.companyId,
        role: 'pharmacy_manager',
      },
      select: { id: true },
    });

    if (!managers.length) return;

    await this.prisma.notification.createMany({
      data: managers.map((m) => ({
        userId: m.id,
        title: 'Shift Cancelled',
        message: `The shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} has been cancelled.`,
        type: 'shift',
        actionUrl: `${shift.id}`,
      })),
    });
  }

  @OnEvent(AppEvents.SHIFT_COMPLETED)
  async handleShiftCompletedEvent(payload: any) {
    const { shift } = payload;
    this.logger.log(`Shift completed: ${shift.id}`);

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };

    const formattedDate = shift.startTime.toLocaleDateString('en-US', dateOptions); 
    const formattedStartTime = shift.startTime.toLocaleTimeString('en-US', timeOptions);
    const formattedEndTime = shift.endTime.toLocaleTimeString('en-US', timeOptions);

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
              message: `The shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} has been completed.`,
              type: 'shift',
              actionUrl: `${shift.id}`,
          }
      });
      }
    }

    // Notify managers of the company
    const managers = await this.prisma.user.findMany({
      where: {
        companyId: shift.companyId,
        role: 'pharmacy_manager',
      },
      select: { id: true },
    });

    if (!managers.length) return;

    await this.prisma.notification.createMany({
      data: managers.map((m) => ({
        userId: m.id,
        title: 'Shift Completed',
        message: `The shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} has been completed.`,
        type: 'shift',
        actionUrl: `${shift.id}`,
      })),
    });
  }
}
