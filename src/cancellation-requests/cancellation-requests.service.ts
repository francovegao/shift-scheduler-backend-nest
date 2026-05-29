import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCancellationRequestDto } from './dto/create-cancellation-request.dto';
import { UpdateCancellationRequestDto } from './dto/update-cancellation-request.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';
import { ProcessCancellationRequestDto } from './dto/process-cancellation-request.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailService } from 'src/email/email.service';
import { AppEvents } from 'src/events/app-events';

@Injectable()
export class CancellationRequestsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private emailService: EmailService,
  ) {}

  async create(createCancellationRequestDto: CreateCancellationRequestDto) {
    const cancellationRequest =
      await this.prisma.shiftCancellationRequest.create({
        data: createCancellationRequestDto,
      });

    return cancellationRequest;
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};

    const include: any = {
      shift: {
        include: {
          company: true,
          location: true,
        },
      },
      pharmacist: {
        include: {
          user: true,
        },
      },
    };

    const orderBy: any = { createdAt: 'desc' };

    const [cancellationRequests, total] = await Promise.all([
      this.prisma.shiftCancellationRequest.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.company.count({ where }),
    ]);

    const response = {
      data: cancellationRequests,
      meta: {
        totalItems: total,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return response;
  }

  findOne(id: string) {
    return this.prisma.shiftCancellationRequest.findUnique({ where: { id } });
  }

  async process(
    id: string,
    processCancellationRequestDto: ProcessCancellationRequestDto,
  ) {
    const cancellationRequest =
      await this.prisma.shiftCancellationRequest.findUnique({
        where: {
          id,
        },
        include: {
          shift: {
            include: {
              pharmacist: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                    },
                  },
                },
              },
              company: {
                select: {
                  name: true,
                  timezone: true,
                },
              },
            },
          },
        },
      });

    if (!cancellationRequest) {
      throw new NotFoundException('Cancellation request not found');
    }

    if (cancellationRequest?.status !== 'pending') {
      throw new ForbiddenException('Cancellation request already processed');
    }

    const shift = cancellationRequest.shift;

    if (!shift) {
      throw new NotFoundException('Associated shift not found');
    }

    if (!shift.published) {
      throw new ForbiddenException('Shift is not published');
    }

    if (shift.status !== 'taken') {
      throw new ForbiddenException('Shift is no longer available');
    }

    if (processCancellationRequestDto.status === 'rejected') {
      const cancellationRequest =
        await this.prisma.shiftCancellationRequest.update({
          where: { id },
          data: {
            status: processCancellationRequestDto.status,
            reviewedAt: new Date(),
            reviewedBy: processCancellationRequestDto.reviewedBy,
          },
        });

      this.eventEmitter.emit(AppEvents.CANCEL_REQUEST_REJECTED, {
        cancellationRequest: cancellationRequest,
      });

      if (shift?.pharmacist?.user?.email) {
        this.emailService.emailPharmacistCancelRequestRejected(
          shift?.pharmacist?.user?.email,
          shift,
        );
      }

      return { success: true };
    }

    if (processCancellationRequestDto.status === 'approved') {
      let targetPharmacistId: string | null = cancellationRequest.pharmacistId;
      if (processCancellationRequestDto.newShiftStatus === 'open')
        targetPharmacistId = null;
      if (processCancellationRequestDto.newShiftStatus === 'taken')
        targetPharmacistId = processCancellationRequestDto.pharmacistId || null;

      await this.prisma.$transaction([
        this.prisma.shiftCancellationRequest.update({
          where: { id },
          data: {
            status: processCancellationRequestDto.status,
            reviewedAt: new Date(),
            reviewedBy: processCancellationRequestDto.reviewedBy,
          },
        }),

        this.prisma.shift.update({
          where: { id: cancellationRequest.shiftId },
          data: {
            status: processCancellationRequestDto.newShiftStatus,
            pharmacistId: targetPharmacistId,
          },
        }),
      ]);

      this.eventEmitter.emit(AppEvents.CANCEL_REQUEST_APPROVED, {
        cancellationRequest: cancellationRequest,
        originalShift: shift,
      });

      // TODO: ADD SEND EMAIL TO ORIGINAL PHARMACIST
      if (shift?.pharmacist?.user?.email) {
        this.emailService.emailPharmacistCancelRequestApproved(
          shift?.pharmacist?.user?.email,
          shift,
        );
      }
      if (
        processCancellationRequestDto.newShiftStatus === 'taken' &&
        processCancellationRequestDto.pharmacistId
      ) {
        const updatedShift = await this.prisma.shift.findUnique({
          where: {
            id: cancellationRequest.shiftId,
          },
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
                    lastName: true,
                  },
                },
              },
            },
          },
        });
        // TODO: ADD SEND EMAIL TO NEW PHARMACIST
        this.eventEmitter.emit(AppEvents.SHIFT_TAKEN, {
          shift: updatedShift,
        });

        if (updatedShift?.pharmacist?.user.email) {
          this.emailService.emailPharmacistShiftTaken(
            updatedShift?.pharmacist?.user.email,
            updatedShift,
          );
        }
      }

      return { success: true };
    }
  }

  remove(id: string) {
    return this.prisma.shiftCancellationRequest.delete({ where: { id } });
  }
}
