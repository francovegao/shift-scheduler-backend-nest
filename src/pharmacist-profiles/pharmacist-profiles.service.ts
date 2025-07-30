import { Injectable } from '@nestjs/common';
import { CreatePharmacistProfileDto } from './dto/create-pharmacist-profile.dto';
import { UpdatePharmacistProfileDto } from './dto/update-pharmacist-profile.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PharmacistProfilesService {
  constructor(private prisma: PrismaService) {}

  //CRUD operations
  create(createPharmacistProfileDto: CreatePharmacistProfileDto) {
    //return 'This action adds a new pharmacistProfile';
    return this.prisma.pharmacistProfile.create({ data: createPharmacistProfileDto });
  }

  findAll() {
    //return `This action returns all pharmacistProfiles`;
    return this.prisma.pharmacistProfile.findMany();
  }

  findOne(id: string) {
    //return `This action returns a #${id} pharmacistProfile`;
    return this.prisma.pharmacistProfile.findUnique({ where: { id } });
  }

  update(id: string, updatePharmacistProfileDto: UpdatePharmacistProfileDto) {
    //return `This action updates a #${id} pharmacistProfile`;
    return this.prisma.pharmacistProfile.update({ where: { id }, data: updatePharmacistProfileDto });
  }

  remove(id: string) {
    //return `This action removes a #${id} pharmacistProfile`;
    return this.prisma.pharmacistProfile.delete({ where: { id } });
  }
}
