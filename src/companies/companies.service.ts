import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  //CRUD operations
  create(createCompanyDto: CreateCompanyDto) {
    //return 'This action adds a new company';
    return this.prisma.company.create({ data: createCompanyDto });
  }

  async findAll(
    paginationDto: PaginationDto,
    search?: string,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
    ) {
    const { page = 1 , limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query = search;

    const where: any = {};

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { legalName: { contains: query, mode: 'insensitive' } },
        { GSTNumber: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { province: { contains: query, mode: 'insensitive' } },
        { postalCode: { contains: query, mode: 'insensitive' } },
      ];
    }

    
    //Sort filters
    let orderBy: any = [];

    if(sortBy){
      const direction = sortOrder === "desc" ? "desc" : "asc";

      switch(sortBy){
        case "name":
          orderBy = [{ name: direction }];
          break;
        case "legalName":
          orderBy = [{ legalName: direction }];
          break;
        default:
          orderBy = [{ createdAt: "desc" }];
      }
    }else{
      orderBy = [{ createdAt: "desc" }];
    }

    const [companies, total] = await Promise.all([this.prisma.company.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    }),
    this.prisma.company.count({where}),
    ]);

    const response = {
      data: companies,
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

    const company = await this.prisma.company.findUnique({ 
      where: { id },
      include: {
        managers: true,
        locations: true,
        shifts: true,
        allowedPharmacists: true,
      }
     });

    if (!company) {
        throw new NotFoundException(`Company with ID "${id}" not found.`);
    }

    const [openShifts, takenShifts, completedShifts, cancelledShifts] = await this.prisma.$transaction([
      this.prisma.shift.count({
          where: {
          companyId: company.id,
          locationId: null,
          status: 'open',
        },
      }),
      this.prisma.shift.count({
          where: {
          companyId: company.id,
          locationId: null,
          status: 'taken',
        },
      }),
      this.prisma.shift.count({
          where: {
          companyId: company.id,
          locationId: null,
          status: 'completed',
        },
      }),
      this.prisma.shift.count({
          where: {
          companyId: company.id,
          locationId: null,
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
      WHERE "companyId" = ${company.id} AND "locationId" IS NULL AND "startTime" >= ${startOfYear}::TIMESTAMP AND "startTime" <= ${endOfYear}::TIMESTAMP
      GROUP BY 1
      ORDER BY 1;
    `;

    const response = {
      data: company,
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
    const company = await this.prisma.company.findUnique({ 
      where: { id },
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
          }
        },
      }
     });

     return {
      data: company?.shifts
     }
  }

  update(id: string, updateCompanyDto: UpdateCompanyDto) {
    //return `This action updates a #${id} company`;
    return this.prisma.company.update({ where: { id }, data: updateCompanyDto });
  }

  remove(id: string) {
    //return `This action removes a #${id} company`;
    return this.prisma.company.delete({ where: { id } });
  }
}
