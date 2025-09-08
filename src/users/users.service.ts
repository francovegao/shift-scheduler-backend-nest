import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Role } from 'generated/prisma';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';
import { ARRAY_CONTAINS } from 'class-validator';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService){}

  //CRUD operations
  create(createUserDto: CreateUserDto) {
    //return 'This action adds a new user';
    return this.prisma.user.create({ data: createUserDto});
  }

  async findAll(
    paginationDto: PaginationDto, 
    search?: string,
    locationId?: string, 
    companyId?: string
  ) {
    const { page = 1 , limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query = search;
    const location = locationId;
    const company = companyId;

    const where: any = {};

    const include: any = {
        company: true,
        location: true,
    }

    if (query) {
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ];
    }

    if(company){
        where.OR= [
          { some: {
              companyId: company,
              }, 
          },
        ];
      }

    if(location){
      where.OR= [
        {  some: {
            locationId: location,
            },
        },
      ];
    }

    const [users, total] = await Promise.all([this.prisma.user.findMany({
      where,
      include,
      skip,
      take: limit,
    }),
    this.prisma.user.count({where}),
    ]);

    const response = {
      data: users,
      meta: {
        totalItems: total,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
      }
    };

    return response;
  }

  async findPharmacists(paginationDto: PaginationDto, search?: string) {
    const { page = 1 , limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query = search;

    const where: any = {
      role: 'relief_pharmacist'
    };

    const include: any = {
      pharmacistProfile: true,
    } 

    if (query) {
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [pharmacists, total] = await Promise.all([this.prisma.user.findMany({
      where,
      include,
      skip,
      take: limit,
    }),
    this.prisma.user.count({where}),
    ]);

    const response = {
      data: pharmacists,
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
    //return `This action returns a #${id} user`;
    return this.prisma.user.findUnique({ 
      where: { id },
     });
  }

  findOneUid(uid: string) {
    return this.prisma.user.findUnique({ 
      where: { 
        firebaseUid: uid,
      },
     });
  }

  async findMyRole(uid: string) {

    const user = await this.prisma.user.findUnique({ 
      where: { 
        firebaseUid: uid,
      },
     }); 

     return {
      role: user?.role,
     }
  }

  findNotifications(id: string) {
    return this.prisma.user.findUnique({ 
      where: { id },
      include: {
        notifications: true,
      },
     });
  }

  findFiles(id: string) {
    return this.prisma.user.findUnique({ 
      where: { id },
      include: {
        files: true,
      },
     });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    //return `This action updates a #${id} user`;
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: string) {
    //return `This action removes a #${id} user`;
    return this.prisma.user.delete({ where: { id } });
  }
}
