import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'generated/prisma';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService){}

  //CRUD operations
  create(createUserDto: CreateUserDto) {
    //return 'This action adds a new user';
    return this.prisma.user.create({ data: createUserDto});
  }

  findTests() {
    return this.prisma.user.findMany({ where: { email: {contains: "test.com" } } });
  }

  findAll() {
    //return `This action returns all users`;
    return this.prisma.user.findMany({ where: { firstName: {not: null } } });
  }

  findOne(id: string) {
    //return `This action returns a #${id} user`;
    return this.prisma.user.findUnique({ 
      where: { id },
      include: {
        roles: true,
      },
     });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    //return `This action updates a #${id} user`;
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: string) {
    //return `This action removes a #${id} user`;
    return this.prisma.user.delete({ where: { id } });
  }
}
