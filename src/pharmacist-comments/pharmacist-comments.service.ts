/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePharmacistCommentDto } from './dto/create-pharmacist-comment.dto';
import { UpdatePharmacistCommentDto } from './dto/update-pharmacist-comment.dto';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';

@Injectable()
export class PharmacistCommentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    currentUser: any,
    createPharmacistCommentDto: CreatePharmacistCommentDto,
  ) {
    // Only pharmacy_manager and admin can create comments
    if (
      currentUser.role !== 'pharmacy_manager' &&
      currentUser.role !== 'admin'
    ) {
      throw new ForbiddenException(
        'Only managers and admins can create comments',
      );
    }

    // Verify pharmacist exists
    const pharmacist = await this.prisma.pharmacistProfile.findUnique({
      where: { id: createPharmacistCommentDto.pharmacistId },
    });

    if (!pharmacist) {
      throw new NotFoundException('Pharmacist not found');
    }

    // Set companyId and locationId from currentUser if not provided
    const companyId =
      createPharmacistCommentDto.companyId || currentUser.companyId || null;
    const locationId =
      createPharmacistCommentDto.locationId || currentUser.locationId || null;

    return this.prisma.pharmacistComment.create({
      data: {
        pharmacistId: createPharmacistCommentDto.pharmacistId,
        authorId: currentUser.id,
        comment: createPharmacistCommentDto.comment,
        companyId,
        locationId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async findByPharmacist(pharmacistId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where = { pharmacistId };

    const [comments, total] = await Promise.all([
      this.prisma.pharmacistComment.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.pharmacistComment.count({ where }),
    ]);

    return {
      data: comments,
      meta: {
        totalItems: total,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(
    currentUser: any,
    id: string,
    updatePharmacistCommentDto: UpdatePharmacistCommentDto,
  ) {
    const comment = await this.prisma.pharmacistComment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only the author can update their own comment
    if (comment.authorId !== currentUser.id) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.pharmacistComment.update({
      where: { id },
      data: {
        comment: updatePharmacistCommentDto.comment,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(currentUser: any, id: string) {
    const comment = await this.prisma.pharmacistComment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Author can delete their own comment, admin can delete any comment
    if (comment.authorId !== currentUser.id && currentUser.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.pharmacistComment.delete({ where: { id } });
    return { success: true };
  }
}
