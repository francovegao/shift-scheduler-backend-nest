import { Injectable } from '@nestjs/common';
import { CreatePharmacistProfileDto } from './dto/create-pharmacist-profile.dto';
import { UpdatePharmacistProfileDto } from './dto/update-pharmacist-profile.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PharmacistProfilesService {
  constructor(private prisma: PrismaService) {}

  //CRUD operations
  async create(createPharmacistProfileDto: CreatePharmacistProfileDto) {
    const { companyPermissions, ...profileData } = createPharmacistProfileDto;

    return this.prisma.pharmacistProfile.create({
      data: {
        ...profileData,
        companyPermissions: companyPermissions ? {
          create: companyPermissions.map((permission) => ({
            companyId: permission.companyId,
            canViewPayRate: permission.canViewPayRate,
          })),
        } : undefined,
      },
      include: {
        companyPermissions: true, 
      },
    });
  }

  findAll() {
    //return `This action returns all pharmacistProfiles`;
    return this.prisma.pharmacistProfile.findMany();
  }

  findOne(id: string) {
    //return `This action returns a #${id} pharmacistProfile`;
    return this.prisma.pharmacistProfile.findUnique({ where: { id } });
  }

 async update(
    id: string,
    updatePharmacistProfileDto: UpdatePharmacistProfileDto
  ) {
    const { companyPermissions, ...profileData } = updatePharmacistProfileDto;
    
    return await this.prisma.$transaction(async (tx) => {
      const updatedProfile = await tx.pharmacistProfile.update({
        where: { id },
        data: profileData,
      });

      if (companyPermissions) {
        await tx.pharmacistCompanyPermission.deleteMany({ where: { pharmacistId: id } });
        
        await tx.pharmacistCompanyPermission.createMany({
          data: companyPermissions.map((item) => ({
            pharmacistId: id,
            companyId: item.companyId,
            canViewPayRate: item.canViewPayRate,
          })),
        });
      }

      // Return the full updated profile with permissions
      return tx.pharmacistProfile.findUnique({
        where: { id },
        include: { companyPermissions: true },
      });
    });
  }

  remove(id: string) {
    //return `This action removes a #${id} pharmacistProfile`;
    return this.prisma.pharmacistProfile.delete({ where: { id } });
  }
}
