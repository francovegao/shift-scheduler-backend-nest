import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';
import { equal } from 'assert';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  //CRUD operations
  create(createShiftDto: CreateShiftDto) {
    //return 'This action adds a new shift';
    return this.prisma.shift.create({ data: createShiftDto });
  }

  /*async findAll(
    currentUser: any,
    paginationDto: PaginationDto, 
    search?: string, 
    locationId?: string, 
    companyId?: string,
    pharmacistId?: string
  ) {
     const { page = 1 , limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query = search;
    const location = locationId;
    const company = companyId;
    const pharmacist = pharmacistId;

    const where: any = {};

    const include: any = {
      company: true,
      location: true,
      pharmacist: {
        include: {
          user: true,
        },
      },
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        //{ startTime: { contains: query, mode: 'insensitive' } },
        //{ endTime: { contains: query, mode: 'insensitive' } },
        //{ payRate: { contains: query, mode: 'insensitive' } },
        //{ status: { contains: query, mode: 'insensitive' } },
      ];
    }

    if(location || company || pharmacist ){
      where.OR= [
        { locationId: location},
        { companyId: company },
        { pharmacistId: pharmacist },
      ];
    }

    const [shifts, total] = await Promise.all([this.prisma.shift.findMany({
      where,
      include,
      skip,
      take: limit,
    }),
    this.prisma.shift.count({where}),
    ]);

    const response = {
      data: shifts,
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
    locationId?: string, 
    companyId?: string,
    pharmacistId?: string
  ) {
    const { page = 1 , limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Build dynamic filters
    const where: any = { AND: [] };

    // Role-based scoping
    if (currentUser.role === 'pharmacy_manager') {
      where.AND.push({ companyId: currentUser.companyId });
    }
    if (currentUser.role === 'location_manager') {
      if(currentUser.companyId){
        where.AND.push({ companyId: currentUser.companyId });
      }else{
        throw new ForbiddenException('Location Manager not linked to any company (Add company ID) ');
      }
    }
    if (currentUser.role === 'relief_pharmacist') {
      where.AND.push({ status: 'open' });
    }

    // External filter
    if (companyId) {
    where.AND.push({ companyId });
    }
    if (locationId) {
      where.AND.push({ locationId });
    }
    if (pharmacistId) {
      where.AND.push({ pharmacistId });
    }

    const include: any = {
      company: true,
      location: true,
      pharmacist: {
        include: {
          user: true,
        },
      },
    }

    //Search filter
    if (search) {
      const startDate = new Date(search);
      const endDate = new Date(search);

      where.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { startTime: { 
            gte: new Date(startDate.setHours(0,0,0,0)),
            lte: new Date(endDate.setHours(23,59,59,999)),
           } },
           
          //{ payRate: { contains: search, mode: 'insensitive' } },
          //{ status: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const [shifts, total] = await Promise.all([this.prisma.shift.findMany({
      where,
      include,
      skip,
      take: limit,
    }),
    this.prisma.shift.count({where}),
    ]);

    const response = {
      data: shifts,
      meta: {
        totalItems: total,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
      }
    };

    return response;
  }

  async findPharmacistShifts(
    currentUser: any,
    paginationDto: PaginationDto, 
    search?: string, 
  ) {
    const { page = 1 , limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Build dynamic filters
    const where: any = { AND: [] };

    if (currentUser.role === 'relief_pharmacist') {
      where.AND.push({ 
        pharmacist: {
          userId: currentUser.id,
        } 
      });
    }

    const include: any = {
      company: true,
      location: true,
      pharmacist: {
        include: {
          user: true,
        },
      },
    }

    //Search filter
    if (search) {
      where.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const [shifts, total] = await Promise.all([this.prisma.shift.findMany({
      where,
      include,
      skip,
      take: limit,
    }),
    this.prisma.shift.count({where}),
    ]);

    const response = {
      data: shifts,
      meta: {
        totalItems: total,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
      }
    };

    return response;
  }

async findShiftsByDate(
    currentUser: any,
    paginationDto: PaginationDto, 
    date?: string
  ) {
    const { page = 1 , limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Build dynamic filters
    const where: any = { AND: [] };

    const include: any = {
      company: true,
      location: true,
      pharmacist: {
        include: {
          user: true,
        },
      },
    }

    //Search filter
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);

      where.AND.push({
        OR: [
          { startTime: { 
            gte: new Date(startDate.setHours(0,0,0,0)),
            lte: new Date(endDate.setHours(23,59,59,999)),
           } },
        ],
      });
    }

    const [shifts, total] = await Promise.all([this.prisma.shift.findMany({
      where,
      include,
      skip,
      take: limit,
    }),
    this.prisma.shift.count({where}),
    ]);

    const response = {
      data: shifts,
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
    //return `This action returns a #${id} shift`;
    return this.prisma.shift.findUnique({ where: { id } });
  }

  update(id: string, updateShiftDto: UpdateShiftDto) {
    //return `This action updates a #${id} shift`;
    return this.prisma.shift.update({ where: { id }, data: updateShiftDto });
  }

  remove(id: string) {
    //return `This action removes a #${id} shift`;
    return this.prisma.shift.delete({ where: { id } });
  }
}
