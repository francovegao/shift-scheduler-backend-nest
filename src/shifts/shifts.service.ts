import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';
import { equal } from 'assert';
import { ShiftStatus } from 'generated/prisma';

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
    pharmacistId?: string,
    fromDate?: Date,
    toDate?: Date,
    minRate?: string,
    maxRate?: string,
    selectedStatus?: string,
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
      where.AND.push({ locationId: currentUser.locationId });
    }
    if (currentUser.role === 'relief_pharmacist') {
      // Get pharmacist profile and allowed companies
      const pharmacist = await this.prisma.pharmacistProfile.findUnique({
        where: { userId: currentUser.id },
        include: { allowedCompanies: true },
      });

      if (!pharmacist) {
        throw new Error("Pharmacist profile not found");
      }

      if(pharmacist.canViewAllCompanies){
        where.AND.push({ status: 'open' });
      }else{
        const allowedCompanyIds = pharmacist.allowedCompanies.map((c) => c.id);

        where.AND.push({ 
          status: 'open',
          companyId: { in: allowedCompanyIds },
          });
      }

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
      where.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { company : { name: {contains: search, mode: 'insensitive' }}}, 
          { company : { email: {contains: search, mode: 'insensitive' }}}, 
          { company : { phone: {contains: search, mode: 'insensitive' }}}, 
          { company : { address: {contains: search, mode: 'insensitive' }}}, 
          { company : { city: {contains: search, mode: 'insensitive' }}}, 
          { location : { name: {contains: search, mode: 'insensitive' }}},
          { location : { email: {contains: search, mode: 'insensitive' }}},
          { location : { phone: {contains: search, mode: 'insensitive' }}},
          { location : { address: {contains: search, mode: 'insensitive' }}},
          { location : { city: {contains: search, mode: 'insensitive' }}},
          { pharmacist : { user: { firstName: {contains: search, mode: 'insensitive' }}}},
          { pharmacist : { user: { lastName: {contains: search, mode: 'insensitive' }}}},
          { pharmacist : { user: { email: {contains: search, mode: 'insensitive' }}}},
          { pharmacist : { user: { phone: {contains: search, mode: 'insensitive' }}}},
        ],
      });
    }

    //Status Filter
    where.AND.push({
      status: selectedStatus ? { equals: selectedStatus } : undefined,
    });

    //Pay Rate Filter
    const min = minRate ? parseFloat(minRate) : undefined;
    const max = maxRate ? parseFloat(maxRate) : undefined;

    if (min !== undefined || max !== undefined) {
      where.AND.push({
        payRate: {
          ...(min !== undefined && { gte: min }),
          ...(max !== undefined && { lte: max }),
        },
      });
    }

    //Date Filter
    let parsedStart: Date | undefined;
    let parsedEnd: Date | undefined;

    if (fromDate) {
      parsedStart = new Date(fromDate);
      if (isNaN(parsedStart.getTime())) throw new Error(`Invalid fromDate: ${fromDate}`);
    }

    if (toDate) {
      parsedEnd = new Date(toDate);
      if (isNaN(parsedEnd.getTime())) throw new Error(`Invalid toDate: ${toDate}`);
    }

     if (parsedStart || parsedEnd) {
      where.AND.push({
        startTime: {
          ...(parsedStart && { gte: parsedStart }),
          ...(parsedEnd && { lte: parsedEnd }),
        },
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
    selectedStatus?: string,
    fromDate?: Date,
    toDate?: Date,
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
          { company : { name: {contains: search, mode: 'insensitive' }}}, 
          { company : { email: {contains: search, mode: 'insensitive' }}}, 
          { company : { phone: {contains: search, mode: 'insensitive' }}}, 
          { company : { address: {contains: search, mode: 'insensitive' }}}, 
          { company : { city: {contains: search, mode: 'insensitive' }}}, 
          { location : { name: {contains: search, mode: 'insensitive' }}},
          { location : { email: {contains: search, mode: 'insensitive' }}},
          { location : { phone: {contains: search, mode: 'insensitive' }}},
          { location : { address: {contains: search, mode: 'insensitive' }}},
          { location : { city: {contains: search, mode: 'insensitive' }}},
        ],
      });
    }

    //Status Filter
    where.AND.push({
      status: selectedStatus ? { equals: selectedStatus } : undefined,
    });

    //Date Filter
    let parsedStart: Date | undefined;
    let parsedEnd: Date | undefined;

    if (fromDate) {
      parsedStart = new Date(fromDate);
      if (isNaN(parsedStart.getTime())) throw new Error(`Invalid fromDate: ${fromDate}`);
    }

    if (toDate) {
      parsedEnd = new Date(toDate);
      if (isNaN(parsedEnd.getTime())) throw new Error(`Invalid toDate: ${toDate}`);
    }

     if (parsedStart || parsedEnd) {
      where.AND.push({
        startTime: {
          ...(parsedStart && { gte: parsedStart }),
          ...(parsedEnd && { lte: parsedEnd }),
        },
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

  async findAllUserShifts(
    currentUser: any,
    paginationDto: PaginationDto, 
  ) {
    const { page = 1 , limit = 1000 } = paginationDto;
    const skip = (page - 1) * limit;

    // Build dynamic filters
    const where: any = { AND: [] };

    //Role based filters
    let openWhere: any = {};

    if (currentUser.role === 'admin') {
      openWhere = {  status: 'open' };
    }

    if (currentUser.role === 'pharmacy_manager') {
      where.AND.push({ companyId: currentUser.companyId });

      openWhere = { ...where, status: 'open' };
    }

    if (currentUser.role === 'location_manager') {
      where.AND.push({ locationId: currentUser.locationId});

      openWhere = { ...where, status: 'open' };
    }


    if (currentUser.role === 'relief_pharmacist') {
      where.AND.push({ 
        pharmacist: {
          userId: currentUser.id,
        } 
      });

      openWhere = {  status: 'open' };

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

    const [shifts, total, open, taken, completed, cancelled] = await this.prisma.$transaction([
      this.prisma.shift.findMany({
      where,
      include,
      skip,
      take: limit,
    }),
    this.prisma.shift.count({where}),
    this.prisma.shift.count({where: openWhere}),
    this.prisma.shift.count({ where: { ...where, status: 'taken' } }),
    this.prisma.shift.count({ where: { ...where, status: 'completed' } }),
    this.prisma.shift.count({ where: { ...where, status: 'cancelled' } }),
    ]);

    const response = {
      data: shifts,
      meta: {
        totalItems: total,
        totalOpen: open,
        totalTaken: taken,
        totalCompleted: completed,
        totalCancelled: cancelled,
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

    // Role-based scoping
    if (currentUser.role === 'relief_pharmacist') {
      where.AND.push({ status: 'open' });
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

  async findLatestShifts(
    currentUser: any,
    paginationDto: PaginationDto, 
  ) {
    const { page = 1 , limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Build dynamic filters
    const where: any = { AND: [] };

    //Role based filtering
    if (currentUser.role === 'pharmacy_manager') {
      where.AND.push({ companyId: currentUser.companyId });
    }

    if (currentUser.role === 'location_manager') {
      where.AND.push({ locationId: currentUser.locationId });
    }

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

    const [shifts, total] = await Promise.all([this.prisma.shift.findMany({
      where,
      include,
      skip,
      take: limit,
      orderBy: {
          createdAt: 'desc',
        },
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
