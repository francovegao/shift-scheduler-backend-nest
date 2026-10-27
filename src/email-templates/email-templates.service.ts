import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import Handlebars from 'handlebars';
import {
  createEmailTemplatePreviewData,
  getEmailTemplateDataSchema,
} from 'src/email/email-template-data.schema';
import { EmailTemplateValidationService } from 'src/email/email-template-validation.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailTemplateDraftDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';

export type AuthenticatedUser = { id: string; role: string };

@Injectable()
export class EmailTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templateValidator: EmailTemplateValidationService,
  ) {}

  async findAll(currentUser: AuthenticatedUser) {
    this.requireAdmin(currentUser);

    return this.prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        variables: true,
        isActive: true,
        allowManualSend: true,
        updatedAt: true,
        updatedById: true,
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
          select: { version: true, createdAt: true, changedById: true },
        },
      },
    });
  }

  async findOne(currentUser: AuthenticatedUser, key: string) {
    this.requireAdmin(currentUser);

    const template = await this.prisma.emailTemplate.findUnique({
      where: { key },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        updatedBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
          include: {
            changedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Email template "${key}" not found`);
    }

    return template;
  }

  async validate(
    currentUser: AuthenticatedUser,
    key: string,
    draft: EmailTemplateDraftDto,
  ) {
    this.requireAdmin(currentUser);
    const template = await this.findTemplate(key);
    const dataSchema = this.getDataSchema(key);

    return this.templateValidator.validate({
      ...draft,
      variables: this.asVariableMap(template.variables),
      dataSchema,
    });
  }

  async preview(
    currentUser: AuthenticatedUser,
    key: string,
    draft: EmailTemplateDraftDto,
  ) {
    this.requireAdmin(currentUser);
    const template = await this.findTemplate(key);
    const dataSchema = this.getDataSchema(key);
    const variables = this.asVariableMap(template.variables);
    const validation = this.templateValidator.validate({
      ...draft,
      variables,
      dataSchema,
    });

    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Email template draft is invalid.',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    const data = createEmailTemplatePreviewData(dataSchema);

    return {
      subject: Handlebars.compile(draft.subjectTemplate)(data),
      html: Handlebars.compile(draft.htmlTemplate)(data),
      text: draft.textTemplate
        ? Handlebars.compile(draft.textTemplate)(data)
        : undefined,
      warnings: validation.warnings,
    };
  }

  async update(
    currentUser: AuthenticatedUser,
    key: string,
    updateEmailTemplateDto: UpdateEmailTemplateDto,
  ) {
    this.requireAdmin(currentUser);
    const template = await this.findTemplate(key);
    const dataSchema = this.getDataSchema(key);
    const validation = this.templateValidator.validate({
      ...updateEmailTemplateDto,
      variables: this.asVariableMap(template.variables),
      dataSchema,
    });

    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Email template draft is invalid.',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const latestVersion = await tx.emailTemplateVersion.findFirst({
        where: { templateId: template.id },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      const version = (latestVersion?.version ?? 0) + 1;

      const updatedTemplate = await tx.emailTemplate.update({
        where: { key },
        data: {
          subjectTemplate: updateEmailTemplateDto.subjectTemplate,
          htmlTemplate: updateEmailTemplateDto.htmlTemplate,
          textTemplate: updateEmailTemplateDto.textTemplate ?? null,
          isActive: updateEmailTemplateDto.isActive,
          updatedById: currentUser.id,
        },
      });

      const createdVersion = await tx.emailTemplateVersion.create({
        data: {
          templateId: template.id,
          version,
          subjectTemplate: updatedTemplate.subjectTemplate,
          htmlTemplate: updatedTemplate.htmlTemplate,
          textTemplate: updatedTemplate.textTemplate,
          changedById: currentUser.id,
        },
      });

      return { ...updatedTemplate, version: createdVersion.version };
    });
  }

  private requireAdmin(currentUser: AuthenticatedUser): void {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Only admins can manage email templates');
    }
  }

  private async findTemplate(key: string) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { key },
    });

    if (!template) {
      throw new NotFoundException(`Email template "${key}" not found`);
    }

    return template;
  }

  private asVariableMap(value: unknown): Record<string, unknown> {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }

  private getDataSchema(key: string) {
    const schema = getEmailTemplateDataSchema(key);
    if (!schema) {
      throw new InternalServerErrorException(
        `Email template "${key}" has no server-side data schema.`,
      );
    }

    return schema;
  }
}
