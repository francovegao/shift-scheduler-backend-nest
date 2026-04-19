import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { v4 as uuid } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileType } from 'generated/prisma/enums';
import { ExceptionMessages } from 'node_modules/@google-cloud/storage/build/cjs/src/storage';

@Injectable()
export class StorageService {
  constructor(private prisma: PrismaService) {}

  private storage = new Storage();
  private privateBucketName = process.env.GCS_PRIVATE_BUCKET;
  private publicBucketName = process.env.GCS_PUBLIC_BUCKET;

  async getSignedUploadUrl(
    fileName: string,
    contentType: string,
    expectedFileType: FileType,
  ) {
    if (!fileName || !contentType) {
      throw new BadRequestException('File name and content type are required.');
    }

    const isPublic =
      expectedFileType === 'logo' || expectedFileType === 'profilePicture';
    const targetBucketName = isPublic
      ? this.publicBucketName
      : this.privateBucketName;

    if (!targetBucketName) {
      throw new InternalServerErrorException('Storage bucket not defined');
    }

    const allowedTypes = {
      resume: ['application/pdf'],
      logo: ['image/jpeg', 'image/png', 'image/webp'],
      profilePicture: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    };

    if (!allowedTypes[expectedFileType]?.includes(contentType)) {
      throw new BadRequestException(
        `Invalid file type for ${expectedFileType}.`,
      );
    }

    const MAX_SIZE_BYTES =
      expectedFileType === 'resume' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    const sanitizedFileName = fileName
      .replace(/[^a-z0-9.]/gi, '_')
      .toLowerCase();
    const uniqueName = `${uuid()}_${sanitizedFileName}`;

    const bucket = this.storage.bucket(targetBucketName);
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
      publicUrl: `https://storage.googleapis.com/${targetBucketName}/${uniqueName}`,
    };
  }

  async getSignedDownloadUrl(id: string) {
    const fileData = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!fileData) {
      throw new NotFoundException(`File with ID "${id}" not found.`);
    }

    if (!this.privateBucketName) {
      throw new InternalServerErrorException('Storage bucket not defined');
    }

    const file = this.storage
      .bucket(this.privateBucketName)
      .file(fileData.fileName);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 5 * 60 * 1000, // 5 min
    });

    return { url };
  }
}
