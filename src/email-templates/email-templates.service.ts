/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailTemplateDraftDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { SendTestEmailDto } from './dto/send-test-email.dto';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';

export type AuthenticatedUser = { id: string; role: string };

@Injectable()
export class EmailTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templateValidator: EmailTemplateValidationService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(
    currentUser: AuthenticatedUser,
    paginationDto: PaginationDto,
    search?: string,
  ) {
    this.requireAdmin(currentUser);

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query = search;

    const where: any = {};

    const select: any = {
      id: true,
      key: true,
      name: true,
      description: true,
      isActive: true,
      allowManualSend: true,
      updatedAt: true,
      updatedById: true,
      updatedBy: true,
    };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { key: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { subjectTemplate: { contains: query, mode: 'insensitive' } },
        { htmlTemplate: { contains: query, mode: 'insensitive' } },
        { textTemplate: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [emailTemplates, total] = await Promise.all([
      this.prisma.emailTemplate.findMany({
        where,
        select,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.emailTemplate.count({ where }),
    ]);

    const response = {
      data: emailTemplates,
      meta: {
        totalItems: total,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return response;
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

    const response = {
      data: template,
    };

    return response;
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

    const response = {
      data: {
        ...this.renderDraft(draft, data),
        warnings: validation.warnings,
      },
    };

    return response;
  }

  async sendTestEmail(
    currentUser: AuthenticatedUser,
    key: string,
    dto: SendTestEmailDto,
  ) {
    this.requireAdmin(currentUser);
    const template = await this.findTemplate(key);
    const dataSchema = this.getDataSchema(key);
    const validation = this.templateValidator.validate({
      ...dto,
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

    const rendered = this.renderDraft(
      dto,
      createEmailTemplatePreviewData(dataSchema),
    );
    const sent = await this.emailService.sendTestEmail({
      templateKey: key,
      to: dto.recipientEmail,
      ...rendered,
    });

    return { data: { ...sent, warnings: validation.warnings } };
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

      return {
        data: {
          ...updatedTemplate,
          version: createdVersion.version,
        },
      };
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

  private renderDraft(
    draft: EmailTemplateDraftDto,
    data: Record<string, unknown>,
  ) {
    return {
      subject: Handlebars.compile(draft.subjectTemplate)(data),
      html: Handlebars.compile(draft.htmlTemplate)(data),
      text: draft.textTemplate
        ? Handlebars.compile(draft.textTemplate)(data)
        : undefined,
    };
  }
}
