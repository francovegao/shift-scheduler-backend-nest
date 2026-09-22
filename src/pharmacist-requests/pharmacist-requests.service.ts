/* eslint-disable @typescript-eslint/no-floating-promises */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePharmacistRequestDto } from './dto/create-pharmacist-request.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';
import { RejectPharmacistRequestDto } from './dto/reject-pharmacist-request.dto';
import { UsersService } from 'src/users/users.service';
import { ApprovePharmacistRequestDto } from './dto/approve-pharmacist-request.dto';
import { Prisma } from 'generated/prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEvents } from 'src/events/app-events';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class PharmacistRequestsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private eventEmitter: EventEmitter2,
    private emailService: EmailService,
  ) {}

  async create(
    currentUser: any,
    createPharmacistRequestDto: CreatePharmacistRequestDto,
  ) {
    if (currentUser.role !== 'pharmacy_manager') {
      throw new ForbiddenException(
        'Only pharmacy manager can send a Pharmacist Request',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: createPharmacistRequestDto.email },
    });
    if (existingUser) {
      throw new ConflictException(
        'A user with this email address already exists',
      );
    }

    const requestData: Prisma.PharmacistRequestUncheckedCreateInput = {
      ...createPharmacistRequestDto,
      submittedById: currentUser.id,
      status: 'pending',
    };

    const pharmacistRequest = await this.prisma.pharmacistRequest.create({
      data: requestData,
    });

    //emit event for notifications
    this.eventEmitter.emit(AppEvents.PHARMACIST_REQUEST_CREATED, {
      pharmacistRequest: pharmacistRequest,
    });

    //Send email to admin
    const admins = await this.prisma.user.findMany({
      where: { role: 'admin' },
      select: { email: true },
    });

    const recipientList = admins.map((a) => a.email);

    if (recipientList && recipientList.length > 0) {
      const submitter = await this.prisma.user.findUnique({
        where: { id: pharmacistRequest.submittedById },
        select: { firstName: true, lastName: true },
      });

      this.emailService.emailPharmacistRequestCreated(
        recipientList,
        pharmacistRequest,
        `${submitter?.firstName} ${submitter?.lastName}`,
      );
    }

    return pharmacistRequest;
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};

    const include: any = {
      submittedBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    };

    const orderBy: any = { createdAt: 'desc' };

    const [pharmacistRequests, total] = await Promise.all([
      this.prisma.pharmacistRequest.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.pharmacistRequest.count({ where }),
    ]);

    const response = {
      data: pharmacistRequests,
      meta: {
        totalItems: total,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return response;
  }

  async findOne(id: string) {
    const request = await this.prisma.pharmacistRequest.findUnique({
      where: { id },
      include: {
        submittedBy: true,
        reviewedBy: true,
        user: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Pharmacist request not found');
    }
    return request;
  }

  async approve(
    currentUser: any,
    id: string,
    approvePharmacistRequestDto: ApprovePharmacistRequestDto,
  ) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException(
        'Only admins can approve a Pharmacist Request',
      );
    }

    const pharmacistRequest = await this.prisma.pharmacistRequest.findUnique({
      where: {
        id,
      },
    });

    if (!pharmacistRequest) {
      throw new NotFoundException('Pharmacist request not found');
    }

    if (pharmacistRequest?.status !== 'pending') {
      throw new ForbiddenException('Pharmacist request already processed');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: pharmacistRequest.email },
    });
    if (existingUser) {
      throw new ConflictException(
        'A user with this email address already exists',
      );
    }

    const invitationDto = {
      email: pharmacistRequest.email,
      firstName: pharmacistRequest.firstName,
      lastName: pharmacistRequest.lastName,
      phone: pharmacistRequest.phone || undefined,
      licenseNumber: pharmacistRequest.licenseNumber || undefined,
      address: pharmacistRequest.address || undefined,
      city: pharmacistRequest.city || undefined,
      province: pharmacistRequest.province || undefined,
      postalCode: pharmacistRequest.postalCode || undefined,
      eTransferEmail: pharmacistRequest.eTransferEmail || undefined,
      bio: pharmacistRequest.bio || undefined,
      experienceYears: pharmacistRequest.experienceYears || undefined,
      approved: approvePharmacistRequestDto.approved,
      canViewAllCompanies: approvePharmacistRequestDto.canViewAllCompanies,
      canViewPayRates: approvePharmacistRequestDto.canViewPayRates,
    };

    await this.usersService.createPharmacistWithInvitation(invitationDto);

    const updatedPharmacistRequest = await this.prisma.pharmacistRequest.update(
      {
        where: { id },
        data: {
          status: 'approved',
          reviewedAt: new Date(),
          reviewedById: currentUser.id,
        },
      },
    );

    this.eventEmitter.emit(AppEvents.PHARMACIST_REQUEST_APPROVED, {
      pharmacistRequest: updatedPharmacistRequest,
    });

    const submitter = await this.prisma.user.findUnique({
      where: { id: pharmacistRequest.submittedById },
      select: { email: true },
    });

    if (submitter?.email && updatedPharmacistRequest) {
      this.emailService.emailPharmacistRequestApproved(
        submitter?.email,
        updatedPharmacistRequest,
      );
    }

    return { success: true };
  }

  async reject(
    currentUser: any,
    id: string,
    rejectPharmacistRequestDto: RejectPharmacistRequestDto,
  ) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException(
        'Only admins can reject a Pharmacist Request',
      );
    }

    const pharmacistRequest = await this.prisma.pharmacistRequest.findUnique({
      where: {
        id,
      },
    });

    if (!pharmacistRequest) {
      throw new NotFoundException('Pharmacist request not found');
    }

    if (pharmacistRequest?.status !== 'pending') {
      throw new ForbiddenException('Pharmacist request already processed');
    }

    const updatedPharmacistRequest = await this.prisma.pharmacistRequest.update(
      {
        where: { id },
        data: {
          status: 'rejected',
          reviewedAt: new Date(),
          reviewedById: currentUser.id,
          rejectionReason: rejectPharmacistRequestDto.rejectionReason,
        },
      },
    );

    //emit event for notifications
    this.eventEmitter.emit(AppEvents.PHARMACIST_REQUEST_REJECTED, {
      pharmacistRequest: updatedPharmacistRequest,
    });

    //Send email notification to pharmacy manager
    const submitter = await this.prisma.user.findUnique({
      where: { id: pharmacistRequest.submittedById },
      select: { email: true },
    });

    if (submitter?.email) {
      this.emailService.emailPharmacistRequestRejected(
        submitter?.email,
        updatedPharmacistRequest,
      );
    }

    return { success: true };
  }

  async remove(currentUser: any, id: string) {
    const request = await this.prisma.pharmacistRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Pharmacist request not found');
    }

    if (currentUser.role === 'admin') {
      await this.prisma.pharmacistRequest.delete({ where: { id } });
      return { success: true };
    }

    if (currentUser.role === 'pharmacy_manager') {
      if (request.status !== 'pending') {
        throw new ForbiddenException(
          'Cannot delete an already processed request',
        );
      }
      if (request.submittedById !== currentUser.id) {
        throw new ForbiddenException(
          'You cannot delete requests submitted by other managers',
        );
      }

      await this.prisma.pharmacistRequest.delete({ where: { id } });
      return { success: true };
    }

    throw new ForbiddenException(
      'You do not have permission to delete this request',
    );
  }
}
