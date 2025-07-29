import { Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  //CRUD operations
  create(createCompanyDto: CreateCompanyDto) {
    //return 'This action adds a new company';
    return this.prisma.company.create({ data: createCompanyDto });
  }

  findAll() {
    //return `This action returns all companies`;
    return this.prisma.company.findMany();
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
