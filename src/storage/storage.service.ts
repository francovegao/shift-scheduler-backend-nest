import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { v4 as uuid } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StorageService {
  constructor(private prisma: PrismaService) {}

  private storage = new Storage();
  private bucketName = 'pharm-scheduler-file-uploads';

  async getSignedUploadUrl(fileName: string, contentType: string) {
    if (!fileName || !contentType) {
      throw new BadRequestException('File name and content type are required.');
    }

    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
    const sanitizedFileName = fileName
      .replace(/[^a-z0-9.]/gi, '_')
      .toLowerCase();
    const uniqueName = `${uuid()}_${sanitizedFileName}`;

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(uniqueName);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType,
      extensionHeaders: {
        'x-goog-content-length-range': `0,${MAX_SIZE_BYTES}`,
      },
    });

    return {
      url,
      fileName: uniqueName,
      publicUrl: `https://storage.googleapis.com/${this.bucketName}/${uniqueName}`,
    };
  }

  async getSignedDownloadUrl(id: string) {
    const fileData = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!fileData) {
      throw new NotFoundException(`File with ID "${id}" not found.`);
    }

    const file = this.storage.bucket(this.bucketName).file(fileData.fileName);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 5 * 60 * 1000, // 5 min
    });

    return { url };
  }
}
