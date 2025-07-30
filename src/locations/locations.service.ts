import { Injectable } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  //CRUD operations
  create(createLocationDto: CreateLocationDto) {
    //return 'This action adds a new location';
    return this.prisma.location.create({ data: createLocationDto });
  }

  findAll() {
    //return `This action returns all locations`;
    return this.prisma.location.findMany();
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
