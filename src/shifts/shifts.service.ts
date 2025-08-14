import { Injectable } from '@nestjs/common';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  //CRUD operations
  create(createShiftDto: CreateShiftDto) {
    //return 'This action adds a new shift';
    return this.prisma.shift.create({ data: createShiftDto });
  }

  async findAll(paginationDto: PaginationDto, search?: string) {
     const { page = 1 , limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query = search;

    const where: any = {};

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

    const [shifts, total] = await Promise.all([this.prisma.shift.findMany({
      where,
      skip,
      take: limit,
    }),
    this.prisma.shift.count(),
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
