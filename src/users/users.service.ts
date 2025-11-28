import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateFirebaseUserDto } from './dto/create-firebase-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private firebaseService: FirebaseService){}

  //CRUD operations
  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({ data: createUserDto});
  }

  async createFirebaseUser(createFirebaseUserDto: CreateFirebaseUserDto){
    return this.firebaseService.createFirebaseUser(createFirebaseUserDto.email, createFirebaseUserDto.password);
  }

  async findAll(
    paginationDto: PaginationDto, 
    search?: string,
    locationId?: string, 
    companyId?: string,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
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
        pharmacistProfile: true,
        allowedCompanies: true,
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
          {companyId: company },
        ];
      }

    if(location){
      where.OR= [
          {locationId: location },
        ];
    }

    //Sort filters
    let orderBy: any = [];

    if(sortBy){
      const direction = sortOrder === "desc" ? "desc" : "asc";

      switch(sortBy){
        case "firstName":
          orderBy = [{ firstName: direction }];
          break;
        case "lastName":
          orderBy = [{ lastName: direction }];
          break;
        case "company":
          orderBy = [
            { company: { name: direction } },
            { location: { name: direction } },
          ];
          break;
        default:
          orderBy = [{ createdAt: "desc" }];
      }
    }else{
      orderBy = [{ createdAt: "desc" }];
    }

    const [users, total] = await Promise.all([this.prisma.user.findMany({
      where,
      include,
      skip,
      take: limit,
      orderBy,
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

  async findPharmacists(
    paginationDto: PaginationDto, 
    search?: string,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ) {
    const { page = 1 , limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query = search;

    const where: any = {
      role: 'relief_pharmacist'
    };

    const include: any = {
      pharmacistProfile: {
        include: {
          allowedCompanies: true,
        }
      }
    } 

    if (query) {
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ];
    }

    //Sort filters
    let orderBy: any = [];

    if(sortBy){
      const direction = sortOrder === "desc" ? "desc" : "asc";

      switch(sortBy){
        case "firstName":
          orderBy = [{ firstName: direction }];
          break;
        case "lastName":
          orderBy = [{ lastName: direction }];
          break;
        default:
          orderBy = [{ createdAt: "desc" }];
      }
    }else{
      orderBy = [{ createdAt: "desc" }];
    }

    const [pharmacists, total] = await Promise.all([this.prisma.user.findMany({
      where,
      include,
      skip,
      take: limit,
      orderBy,
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

  async findOne(id: string) {
    const user =  await this.prisma.user.findUnique({ 
      where: { 
        id: id,
       },
       include: {
        files: true,
        pharmacistProfile: true,
        company: {
          include: {
            locations: true,
          }
        },
        allowedCompanies: true,
        location: true,
        },
     })

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    const response = {
      data: user,
    };
   
    return response;

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

    const currentYear = new Date().getFullYear();
    const startOfYear = `${currentYear}-01-01`;
    const endOfYear = `${currentYear}-12-31`;

    const monthlyCounts = await this.prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "startTime") AS month,
        COUNT(*)::INT AS count
      FROM "Shift"
      WHERE "pharmacistId" = ${pharmacist.pharmacistProfile?.id} AND "startTime" >= ${startOfYear}::TIMESTAMP AND "startTime" <= ${endOfYear}::TIMESTAMP
      GROUP BY 1
      ORDER BY 1;
    `;

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
      include: {
        pharmacistProfile: {
          select: {
            id: true,
            approved: true,
          }
        },
      }
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
            pharmacist: {
              include: {
                user: true,
              },
            },
          },
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { allowedCompaniesIds, ...userData } = updateUserDto;

    // Get user
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!existingUser) {
      throw new NotFoundException("User not found");
    }

    // Build the base data
    const data: any = { ...userData };

    // If allowedCompaniesIds is provided, update the relation
    if (allowedCompaniesIds !== undefined) {
      if (existingUser.role !== "pharmacy_manager") {
        throw new ForbiddenException(
          "Only pharmacy managers can have allowed companies"
        );
      }

      data.allowedCompanies = {
        set: allowedCompaniesIds.map((companyId) => ({ id: companyId })),
      };
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: { allowedCompanies: true }, 
    });

    return user;
  }

  async remove(id: string) {
    // Find user first to grab their firebase UID
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new InternalServerErrorException('User not found in DB');
    }

    // Delete from DB
    await this.prisma.user.delete({ where: { id } });

    // Delete from Firebase Auth
    try {
      await this.firebaseService.deleteFirebaseUser(user.firebaseUid);
    } catch (error) {
      console.error(`Failed to delete Firebase user: ${user.firebaseUid}`, error);
    }

    return { message: 'User deleted from DB and Firebase' };
  }
  
}
