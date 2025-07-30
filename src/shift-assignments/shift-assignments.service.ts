import { Injectable } from '@nestjs/common';
import { CreateShiftAssignmentDto } from './dto/create-shift-assignment.dto';
import { UpdateShiftAssignmentDto } from './dto/update-shift-assignment.dto';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class ShiftAssignmentsService {
  constructor(private prisma: PrismaService) {}

  //CRUD operations
  create(createShiftAssignmentDto: CreateShiftAssignmentDto) {
    //return 'This action adds a new shiftAssignment';
    return this.prisma.shiftAssignment.create({ data: createShiftAssignmentDto });
  }

  findAll() {
    //return `This action returns all shiftAssignments`;
    return this.prisma.shiftAssignment.findMany();
  }

  findOne(id: string) {
    //return `This action returns a #${id} shiftAssignment`;
    return this.prisma.shiftAssignment.findUnique({ where: { id } });
  }

  update(id: string, updateShiftAssignmentDto: UpdateShiftAssignmentDto) {
    //return `This action updates a #${id} shiftAssignment`;
    return this.prisma.shiftAssignment.update({ where: { id }, data: updateShiftAssignmentDto });
  }

  remove(id: string) {
    //return `This action removes a #${id} shiftAssignment`;
    return this.prisma.shiftAssignment.delete({ where: { id } });
  }
}
