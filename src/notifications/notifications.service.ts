import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService){}
  
  create(createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({ data: createNotificationDto });
  }

  findAll() {
    //return `This action returns all notifications`;
    return this.prisma.notification.findMany();
  }

  async findAllUserNotifications(
      currentUser: any,
      paginationDto: PaginationDto, 
    ) {
      const { page = 1 , limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;
  
      // Build dynamic filters
      const where: any = { AND: [] };

      where.AND.push({ 
        userId: currentUser.id,
      });
  
  
      const [notifications, total] = await Promise.all([this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.notification.count({where}),
      ]);
  
      const response = {
        data: notifications,
        meta: {
          totalItems: total,
          currentPage: page,
          itemsPerPage: limit,
          totalPages: Math.ceil(total / limit),
        }
      };
  
      return response;
    }

 async findUnseenNotifications(
      currentUser: any,
      paginationDto: PaginationDto, 
    ) {
      const { page = 1 , limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;
  
      // Build dynamic filters
      const where: any = { AND: [] };

      where.AND.push({ 
        userId: currentUser.id,
        seen: false,
      });
  
  
      const [notifications, total] = await Promise.all([this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.notification.count({where}),
      ]);
  
      const response = {
        data: notifications,
        meta: {
          totalItems: total,
          currentPage: page,
          itemsPerPage: limit,
          totalPages: Math.ceil(total / limit),
        }
      };
  
      return response;
    }

  findOne(id: string) {
    //return `This action returns a #${id} notification`;
    return this.prisma.notification.findUnique({ where: { id } });
  }

  update(id: string, updateNotificationDto: UpdateNotificationDto) {
    //return `This action updates a #${id} notification`;
    return this.prisma.notification.update({ where: { id }, data: updateNotificationDto });
  }

  remove(id: string) {
    //return `This action removes a #${id} notification`;
    return this.prisma.notification.delete({ where: { id } });
  }
}
