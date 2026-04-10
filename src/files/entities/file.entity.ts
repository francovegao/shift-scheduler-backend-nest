import { ApiProperty } from '@nestjs/swagger';
import { FileType, File } from '../../../generated/prisma/client';

export class FileEntity implements File {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false, nullable: true })
  userId: string | null;

  @ApiProperty({ required: false, nullable: true })
  companyId: string | null;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty({ required: false, nullable: true })
  mimeType: string | null;

  @ApiProperty({ required: false, nullable: true })
  size: number;

  @ApiProperty()
  type: FileType;

  @ApiProperty()
  uploadedAt: Date;
}
