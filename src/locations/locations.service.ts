import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  //CRUD operations
  create(createLocationDto: CreateLocationDto) {
    //return 'This action adds a new location';
    return this.prisma.location.create({ data: createLocationDto });
  }

  /*async findAll(
    currentUser: any,
    paginationDto: PaginationDto, 
    search?: string, 
    companyId?: string
  ) {
      const { page = 1 , limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;
  
      const query = search;
      const company = companyId;
  
      const where: any = {};

      const include: any = {company: true,}

      console.log(currentUser)
      if (currentUser.role === 'pharmacy_manager') {
        where.AND=[ { companyId: currentUser.companyId },];
       }
  
      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { province: { contains: query, mode: 'insensitive' } },
          { postalCode: { contains: query, mode: 'insensitive' } },
        ];
      }

      if(company){
        where.OR= [
          { companyId: company },
        ];
      }
  
      const [locations, total] = await Promise.all([this.prisma.location.findMany({
        where,
        include,
        skip,
        take: limit,
      }),
      this.prisma.location.count({where}),
      ]);
  
      const response = {
        data: locations,
        meta: {
          totalItems: total,
          currentPage: page,
          itemsPerPage: limit,
          totalPages: Math.ceil(total / limit),
        }
      };
  
      return response;
  }*/

  async findAll(
  currentUser: any,
  paginationDto: PaginationDto, 
  search?: string, 
  companyId?: string,
) {
  const { page = 1, limit = 10 } = paginationDto;
  const skip = (page - 1) * limit;

  // Build dynamic filters
  const where: any = { AND: [] };

  // Role-based scoping
  if (currentUser.role === 'pharmacy_manager') {
    where.AND.push({ companyId: currentUser.companyId });
  }

  // External filter by companyId (only if provided by admin request)
  if (companyId) {
    where.AND.push({ companyId });
  }

  //Search filter
  if (search) {
    where.AND.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { GSTNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { province: { contains: search, mode: 'insensitive' } },
        { postalCode: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  const [locations, total] = await Promise.all([
    this.prisma.location.findMany({
      where,
      include: { company: true },
      skip,
      take: limit,
    }),
    this.prisma.location.count({ where }),
  ]);

  return {
    data: locations,
    meta: {
      totalItems: total,
      currentPage: page,
      itemsPerPage: limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}  

  async findOne(id: string) {
    const location = await this.prisma.location.findUnique({ 
      where: { id },
      include: {
        managers: true,
        company: true,
        shifts: true,
      }
    });

    if (!location) {
        throw new NotFoundException(`Location with ID "${id}" not found.`);
    }

    const [openShifts, takenShifts, completedShifts, cancelledShifts] = await this.prisma.$transaction([
      this.prisma.shift.count({
          where: {
          locationId: location.id,
          status: 'open',
        },
      }),
      this.prisma.shift.count({
          where: {
          locationId: location.id,
          status: 'taken',
        },
      }),
      this.prisma.shift.count({
          where: {
          locationId: location.id,
          status: 'completed',
        },
      }),
      this.prisma.shift.count({
          where: {
          locationId: location.id,
          status: 'cancelled',
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
      WHERE "locationId" = ${location.id} AND "startTime" >= ${startOfYear}::TIMESTAMP AND "startTime" <= ${endOfYear}::TIMESTAMP
      GROUP BY 1
      ORDER BY 1;
    `;

    const response = {
      data: location,
      meta: {
        totalOpen: openShifts,
        totalTaken: takenShifts,
        totalCompleted: completedShifts,
        totalCancelled: cancelledShifts,
        monthlyCounts,
      }
    };

    return response;

  }

  async findShifts(id: string) {
    const location = await this.prisma.location.findUnique({ 
      where: { id },
      include: {
        shifts: {
          include: {
            company: true,
            location: true,
          }
        },
      }
     });

     return {
      data: location?.shifts
     }
  }

  update(id: string, updateLocationDto: UpdateLocationDto) {
    //return `This action updates a #${id} location`;
    return this.prisma.location.update({ where: { id }, data: updateLocationDto });
  }

  remove(id: string) {
    //return `This action removes a #${id} location`;
    return this.prisma.location.delete({ where: { id } });
  }
}
