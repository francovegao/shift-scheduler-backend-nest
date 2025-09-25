import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findOnePharmacist(id: string) {

    const pharmacist =  await this.prisma.user.findUnique({ 
      where: { 
        id: id,
        role: 'relief_pharmacist',
       },
       include: {
        files: true,
        pharmacistProfile: {
          include: {
            shifts: true,
          },
        },
      },
     })

    if (!pharmacist) {
      throw new NotFoundException(`Pharmacist with ID "${id}" not found.`);
    }

    const distinctPharmacies = await this.prisma.shift.groupBy({
      by: ['companyId'],
      where: {
        pharmacistId: pharmacist.pharmacistProfile?.id,
      },
    });

    const [completedShifts, cancelledShifts, takenShifts] = await this.prisma.$transaction([
    this.prisma.shift.count({
        where: {
        pharmacistId: pharmacist.pharmacistProfile?.id,
        status: 'completed',
      },
    }),
        this.prisma.shift.count({
        where: {
        pharmacistId: pharmacist.pharmacistProfile?.id,
        status: 'cancelled',
      },
    }),
        this.prisma.shift.count({
        where: {
        pharmacistId: pharmacist.pharmacistProfile?.id,
        status: 'taken',
      },
    }),
    ]);

    const monthlyCounts = await this.prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "startTime") AS month,
        COUNT(*)::INT AS count
      FROM "Shift"
      WHERE "pharmacistId" = ${pharmacist.pharmacistProfile?.id}
      GROUP BY 1
      ORDER BY 1;
    `;

    console.log(monthlyCounts)

    const response = {
      data: pharmacist,
      meta: {
        totalTaken: takenShifts,
        totalCompleted: completedShifts,
        totalCancelled: cancelledShifts,
        totalPharmacies: distinctPharmacies.length,
        monthlyCounts,
      }
    };
   
    return response;
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

  async findShifts(id: string) {
    const user = await this.prisma.user.findUnique({ 
      where: { 
        id: id,
        role: 'relief_pharmacist',
       },
      include: {
        pharmacistProfile: {
          include: {
            shifts: {
              include: {
                company: true,
                location: true,
              }
            },
          },
        },
      },
     });

     return {
      data: user?.pharmacistProfile?.shifts
     }
  }

  async findNotifications(id: string) {
    const user = await this.prisma.user.findUnique({ 
      where: { id },
      include: {
        notifications: {
          where: {
            seen: false,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        }
      },
     });

     return {
      data: user?.notifications
     }
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
