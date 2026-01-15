import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEvents } from 'src/events/app-events';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) {}

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
    shiftId?: string,
    fromDate?: Date,
    toDate?: Date,
    minRate?: string,
    maxRate?: string,
    selectedStatus?: string,
    published?: string,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ) {
    const { page = 1 , limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Build dynamic filters
    const where: any = { AND: [] };

    // Role-based scoping
    if (currentUser.role === 'pharmacy_manager') {

      // Get manager allowed companies
      const manager = await this.prisma.user.findUnique({
        where: { id: currentUser.id },
        include: { allowedCompanies: true },
      });

      if(companyId && manager?.allowedCompanies.find(c => c.id === companyId)){
        where.AND.push({ companyId });
      }else{
        where.AND.push({ companyId: currentUser.companyId });
      }   
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
        where.AND.push({ status: 'open', published: true });
      }else{
        const allowedCompanyIds = pharmacist.allowedCompanies.map((c) => c.id);

        where.AND.push({ 
          status: 'open',
          published: true,
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
    if (shiftId) {
      where.AND.push({ id: shiftId });
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

    //Sort filters
    let orderBy: any = [];

    if(sortBy){
      const direction = sortOrder === "desc" ? "desc" : "asc";

      switch(sortBy){
        case "name":
          orderBy = [
            { company: { name: direction } },
            { location: { name: direction } },
          ];
          break;
        case "payRate":
          orderBy = [{ payRate: direction }];
          break;
        case "startTime":
          orderBy = [{ startTime: direction }];
          break;
        default:
          orderBy = [{ createdAt: "desc" }];
      }
    }else{
      orderBy = [{ createdAt: "desc" }];
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

    //Published Filter
    const isPublished = published === 'true' ? true : published === 'false' ? false : undefined;

    // Published Filter
    if (isPublished !== undefined) {
      where.AND.push({
        published: { equals: isPublished },
      });
    }

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
      orderBy,
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
    shiftId?: string,
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

    //external filters
    if (shiftId) {
      where.AND.push({ id: shiftId });
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
    companyId?: string,
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
    
      // Get manager allowed companies
      const manager = await this.prisma.user.findUnique({
        where: { id: currentUser.id },
        include: { allowedCompanies: true },
      });

      if(companyId && manager?.allowedCompanies.find(c => c.id === companyId)){
        where.AND.push({ companyId });
      }else{
        where.AND.push({ companyId: currentUser.companyId });
      } 

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

      openWhere = {  
        status: 'open',
        published: true 
       };

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
    // if (currentUser.role === 'relief_pharmacist') {
    //   where.AND.push({ status: 'open' });
    // }
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
        where.AND.push({ status: 'open', published: true });
      }else{
        const allowedCompanyIds = pharmacist.allowedCompanies.map((c) => c.id);

        where.AND.push({ 
          status: 'open',
          published: true,
          companyId: { in: allowedCompanyIds },
          });
      }

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
    companyId?: string,
  ) {
    const { page = 1 , limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Build dynamic filters
    const where: any = { AND: [] };

    //Role based filtering
    if (currentUser.role === 'pharmacy_manager') {
      // Get manager allowed companies
      const manager = await this.prisma.user.findUnique({
        where: { id: currentUser.id },
        include: { allowedCompanies: true },
      });

      if(companyId && manager?.allowedCompanies.find(c => c.id === companyId)){
        where.AND.push({ companyId });
      }else{
        where.AND.push({ companyId: currentUser.companyId });
      } 
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

  async findMonthShifts(
    currentUser: any,
    paginationDto: PaginationDto, 
    month?: string
  ) {
    const { page = 1 , limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Build dynamic filters
    const where: any = { AND: [] };

    //Month filter
    if (month) {
      const [year, monthNum] = month.split("-").map(Number);
      const startDate = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

      where.AND.push({
        startTime: { 
            gte: startDate,
            lte: endDate,
           },
      });
    }

    const [shifts, total, statusCounts] = await Promise.all([this.prisma.shift.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startTime: "asc" },
    }),
    this.prisma.shift.count({where}),
    this.prisma.shift.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
    ]);

    const counts = {
      total: 0,
      open: 0,
      taken: 0,
      cancelled: 0,
      completed: 0,
    };

    statusCounts.forEach((item) => {
      counts[item.status] = item._count._all;
      counts.total += item._count._all;
    });

    const response = {
      data: shifts,
      meta: {
        totalItems: total,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        counts: counts,
      }
    };

    return response;
  }

  async findWeekShifts(
    currentUser: any,
    paginationDto: PaginationDto, 
    week: "current" | "last" | "beforeLast" | "next" | "afterNext" = "current"
  ) {
    const { page = 1 , limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const { start, end } = getWeekRange(week);

    // Build dynamic filters
    const where: any = { AND: [] };

    where.AND.push({
        startTime: { 
            gte: start,
            lte: end,
           },
      });

   // Group by day + status
  const raw = await this.prisma.shift.groupBy({
    by: ["status", "startTime"],
    where,
    _count: { _all: true },
  });

  // Initialize all days
  const days: string[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);

    days.push(d.toISOString().slice(0, 10))
  }

  // Normalize per-day results
  const result: Record<string, any> = {};

  days.forEach((key) => {
    result[key] = {
      date: key,
      open: 0,
      taken: 0,
      cancelled: 0,
      completed: 0,
    };
  });

  // Fill counts
  raw.forEach((item) => {
    const dateKey = item.startTime.toISOString().slice(0, 10);
    
    if (!result[dateKey]) return;

    result[dateKey][item.status] += item._count._all;
  });

    const response = {
      data: Object.values(result),
      meta: {
        range: {
          start,
          end,
          week,
        },
      }
    };

    return response;
  }

  findOne(id: string) {
    //return `This action returns a #${id} shift`;
    return this.prisma.shift.findUnique({ where: { id } });
  }

  async update(
    id: string,
    updateShiftDto: UpdateShiftDto,
  ) {
   //find shift before update
   const existingShift = await this.prisma.shift.findUnique({
      where: { id },
    });

    if (!existingShift) {
      throw new NotFoundException('Shift not found');
    }

    const isTakingShift =
      updateShiftDto.status === 'taken';

    if (isTakingShift && !existingShift.published) {
      throw new ForbiddenException(
        'This shift is not published yet and cannot be taken'
      );
    }

    //update shift
    const updatedShift = await this.prisma.shift.update({
      where: { id },
      data: updateShiftDto,
      include: {
        company: {
          select: {
            name: true,
          }
        }
      }
    })

    //compare old vs new shift
    const oldStatus = existingShift.status;
    const newStatus = updatedShift.status;

    //if status was updated -> emit event
    if (oldStatus !== newStatus) {
      switch (newStatus) {
        case 'cancelled':
          this.eventEmitter.emit(AppEvents.SHIFT_CANCELLED, { shift: updatedShift });
          break;
        case 'completed':
          this.eventEmitter.emit(AppEvents.SHIFT_COMPLETED, { shift: updatedShift });
          break;
        case 'taken':
          this.eventEmitter.emit(AppEvents.SHIFT_TAKEN, { shift: updatedShift });
          break;
      }
    }

    return updatedShift;
  }

  remove(id: string) {
    //return `This action removes a #${id} shift`;
    return this.prisma.shift.delete({ where: { id } });
  }

  //Auto complete shifts function for nightly job
  async autoCompleteShifts() {
    const cutoff = new Date();
    cutoff.setHours(8, 0, 0, 0); //+8 hours of new day to make up for time zone

    const cancelled = await this.prisma.shift.updateMany({
        where: {
          status: 'open',
          endTime: { lte: cutoff },
        },
        data: {
          status: 'cancelled',
        },
      });

    const completed = await this.prisma.shift.updateMany({
        where: {
          status: 'taken',
          endTime: { lte: cutoff },
        },
        data: {
          status: 'completed',
        },
      });

      return {
        message: `Auto-closed ${cancelled.count+completed.count} shifts`,
        cutoffTime: cutoff,
        cancelled: cancelled.count,
        completed: completed.count,
      };
  }
}


function getWeekRange(
  week: "current" | "last" | "beforeLast" | "next" | "afterNext",
  timeZone = "America/Vancouver"
){
  const now = new Date();

   // Convert "now" to local date parts
  const local = new Date(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).format(now)
  );

  // Get Monday of current week
  const day = now.getDay(); // 0 (Sun) - 6 (Sat)
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(local);
  monday.setDate(local.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  let start = new Date(monday);
  let end = new Date(monday);

  switch (week) {
    case "last":
      start.setDate(start.getDate() - 7);
      end.setDate(end.getDate() - 1);
      break;

    case "beforeLast":
      start.setDate(start.getDate() - 14);
      end.setDate(end.getDate() - 8);
      break;

    case "next":
      start.setDate(start.getDate() + 7);
      end.setDate(end.getDate() + 13);
      break;

    case "afterNext":
      start.setDate(start.getDate() + 14);
      end.setDate(end.getDate() + 20);
      break;

    case "current":
    default:
      end.setDate(end.getDate() + 6);
      break;
  }

  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function toLocalDateKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date); // YYYY-MM-DD
}

function startOfLocalDay(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(date)
    .reduce((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {} as any);

  return new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00`);
}



