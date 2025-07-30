import { Injectable } from '@nestjs/common';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  //CRUD operations
  create(createShiftDto: CreateShiftDto) {
    //return 'This action adds a new shift';
    return this.prisma.shift.create({ data: createShiftDto });
  }

  findAll() {
    //return `This action returns all shifts`;
    return this.prisma.shift.findMany();
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
