import { Injectable } from '@nestjs/common';
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

  async findAll(
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
  }

  findOne(id: string) {
    //return `This action returns a #${id} location`;
    return this.prisma.location.findUnique({ where: { id }});
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
