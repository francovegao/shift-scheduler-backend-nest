import { Injectable } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async create(createFileDto: CreateFileDto) {
    return this.prisma.file.create({ data: createFileDto });
  }

  findAll() {
    return `This action returns all files`;
  }

  async findCurrentUserFileByType(currentUser: any, type?: string) {
    // Build dynamic filters
    const where: any = { AND: [] };

    where.AND.push({
      userId: currentUser.id,
    });

    if (type) {
      where.AND.push({ type: type });
    } else {
      throw new Error('File Type not specified');
    }

    const [files, total] = await Promise.all([
      this.prisma.file.findUnique({
        where,
      }),
      this.prisma.notification.count({ where }),
    ]);

    const response = {
      data: files,
      meta: {
        totalItems: total,
      },
    };

    return response;
  }

  findOne(id: string) {
    return `This action returns a #${id} file`;
  }

  update(id: string, updateFileDto: UpdateFileDto) {
    const data: any = {
      ...updateFileDto,
      uploadedAt: new Date(),
    };

    return this.prisma.file.update({ where: { id }, data: data });
  }

  remove(id: string) {
    return this.prisma.file.delete({ where: { id } });
  }
}
