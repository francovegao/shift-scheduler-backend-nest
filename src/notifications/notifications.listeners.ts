import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

    const { formattedDate, formattedStartTime, formattedEndTime, tzAbbr } =
      await getFormattedDateAndTime(this.prisma, shift);

    // Notify Pharmacist
    const user = await this.prisma.pharmacistProfile.findUnique({
      where: { id: shift.pharmacistId },
      select: { userId: true },
    });

    if (user) {
      await this.prisma.notification.create({
        data: {
          userId: user.userId,
          title: 'Shift Scheduled',
          message: `You have a new scheduled shift: "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} ${tzAbbr}.`,
          type: 'shift',
          actionUrl: `${shift.id}`,
        },
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

    if (locationManagers.length) {
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
        ],
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

    const { formattedDate, formattedStartTime, formattedEndTime, tzAbbr } =
      await getFormattedDateAndTime(this.prisma, shift);

    // Notify Pharmacist
    if (shift.pharmacistId) {
      const user = await this.prisma.pharmacistProfile.findUnique({
        where: { id: shift.pharmacistId },
        select: { userId: true },
      });

      if (user) {
        await this.prisma.notification.create({
          data: {
            userId: user.userId,
            title: 'Shift Cancelled',
            message: `The shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} ${tzAbbr} has been cancelled.`,
            type: 'shift',
            actionUrl: `reports`,
          },
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

    if (locationManagers.length) {
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
        ],
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

    const { formattedDate, formattedStartTime, formattedEndTime, tzAbbr } =
      await getFormattedDateAndTime(this.prisma, shift);

    // Notify Pharmacist
    if (shift.pharmacistId) {
      const user = await this.prisma.pharmacistProfile.findUnique({
        where: { id: shift.pharmacistId },
        select: { userId: true },
      });

      if (user) {
        await this.prisma.notification.create({
          data: {
            userId: user.userId,
            title: 'Shift Completed',
            message: `The shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} ${tzAbbr} has been completed.`,
            type: 'shift',
            actionUrl: `${shift.id}`,
          },
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

    if (locationManagers.length) {
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
        ],
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

  @OnEvent(AppEvents.SHIFT_CANCELLATION_REQUESTED)
  async handleShiftCancellationRequestedEvent(payload: any) {
    const { cancellationRequest } = payload;
    this.logger.log(`Shift cancellation requested: ${cancellationRequest.id}`);

    const shift = await this.prisma.shift.findUnique({
      where: {
        id: cancellationRequest.shiftId,
        pharmacistId: cancellationRequest.pharmacistId,
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
          select: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    const { formattedDate, formattedStartTime, formattedEndTime, tzAbbr } =
      await getFormattedDateAndTime(this.prisma, shift);

    // Notify Pharmacist
    if (shift.pharmacist) {
      await this.prisma.notification.create({
        data: {
          userId: shift.pharmacist.user.id,
          title: 'Shift Cancellation Requested',
          message: `You requested a cancellation of the shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} ${tzAbbr}. Reason: ${cancellationRequest.reason}`,
          type: 'cancellationRequest',
          actionUrl: `${shift.id}`,
        },
      });
    }

    // Notify admins
    const admins = await this.prisma.user.findMany({
      where: { role: 'admin' },
    });

    if (!admins.length) return;

    await this.prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: 'Shift Cancellation Requested',
        message: `A pharmacist requested to cancel the shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} ${tzAbbr} Pharmacy: ${shift?.company?.name}. Go to the reports page to process this request.`,
        type: 'cancellationRequest',
        actionUrl: `${cancellationRequest.id}`,
      })),
    });
  }

  @OnEvent(AppEvents.CANCEL_REQUEST_REJECTED)
  async handleCancellationRequestRejected(payload: any) {
    const { cancellationRequest } = payload;
    this.logger.log(
      `Shift cancellation request rejected: ${cancellationRequest.id}`,
    );

    const shift = await this.prisma.shift.findUnique({
      where: {
        id: cancellationRequest.shiftId,
        pharmacistId: cancellationRequest.pharmacistId,
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
          select: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    const { formattedDate, formattedStartTime, formattedEndTime, tzAbbr } =
      await getFormattedDateAndTime(this.prisma, shift);

    // Notify Pharmacist
    if (shift.pharmacist) {
      await this.prisma.notification.create({
        data: {
          userId: shift.pharmacist.user.id,
          title: 'Cancellation Request Rejected',
          message: `You shift cancellation request was rejected for the shift "${shift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} ${tzAbbr}. Please be aware that you are still assigned for this shift.`,
          type: 'cancellationRequest',
          actionUrl: `${shift.id}`,
        },
      });
    }
  }

  @OnEvent(AppEvents.CANCEL_REQUEST_APPROVED)
  async handleCancellationRequestApproved(payload: any) {
    const { cancellationRequest, originalShift } = payload;
    this.logger.log(
      `Shift cancellation request approved: ${cancellationRequest.id}`,
    );

    const { formattedDate, formattedStartTime, formattedEndTime, tzAbbr } =
      await getFormattedDateAndTime(this.prisma, originalShift);

    // Notify Pharmacist
    if (originalShift.pharmacist) {
      await this.prisma.notification.create({
        data: {
          userId: originalShift.pharmacist.user.id,
          title: 'Cancellation Request Approved',
          message: `You shift cancellation request was approved for the shift "${originalShift.title}" Shift Date: ${formattedDate} Time: ${formattedStartTime}-${formattedEndTime} ${tzAbbr}.`,
          type: 'cancellationRequest',
          actionUrl: `${originalShift.id}`,
        },
      });
    }
  }
}

async function getFormattedDateAndTime(
  prisma: PrismaService,
  shift: {
    startTime: Date;
    endTime: Date;
    companyId: string;
  },
) {
  const company = await prisma.company.findUnique({
    where: { id: shift.companyId },
    select: { timezone: true },
  });

  const timezone = company?.timezone ?? 'America/Edmonton';

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
  })
    .formatToParts(shift.startTime)
    .find((p) => p.type === 'timeZoneName')?.value;

  return {
    formattedDate: dateFormatter.format(shift.startTime),
    formattedStartTime: timeFormatter.format(shift.startTime),
    formattedEndTime: timeFormatter.format(shift.endTime),
    tzAbbr,
  };
}
