import { ApiProperty } from '@nestjs/swagger';
import { EmailTemplate } from '../../../generated/prisma/client';
import { Prisma } from '../../../generated/prisma/client';

export class EmailTemplateEntity implements EmailTemplate {
  @ApiProperty()
  id: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  description: string | null;

  @ApiProperty()
  subjectTemplate: string;

  @ApiProperty()
  htmlTemplate: string;

  @ApiProperty({ required: false, nullable: true })
  textTemplate: string | null;

  @ApiProperty({ required: false, nullable: true })
  variables: Prisma.JsonValue | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  allowManualSend: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  createdById: string | null;

  @ApiProperty({ required: false, nullable: true })
  updatedById: string | null;
}
