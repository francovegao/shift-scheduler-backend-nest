import { Injectable } from '@nestjs/common';
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

  async findAll(paginationDto: PaginationDto, search?: string) {
    const { page = 1 , limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query = search;

    const where: any = {};

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

    const [companies, total] = await Promise.all([this.prisma.company.findMany({
      where,
      skip,
      take: limit,
    }),
    this.prisma.company.count(),
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

  findOne(id: string) {
    //return `This action returns a #${id} company`;
    return this.prisma.company.findUnique({ where: { id } });
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
