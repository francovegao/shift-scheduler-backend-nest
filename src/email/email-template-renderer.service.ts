import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Handlebars from 'handlebars';
import { getEmailTemplateDataSchema } from './email-template-data.schema';
import { EmailTemplateValidationService } from './email-template-validation.service';

@Injectable()
export class EmailTemplateRendererService {
  constructor(
    private prisma: PrismaService,
    private templateValidator: EmailTemplateValidationService,
  ) {}

  async render(templateKey: string, data: Record<string, unknown>) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: {
        key: templateKey,
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Email template "${templateKey}" not found`);
    }

    if (!template.isActive) {
      throw new Error(`Email template "${templateKey}" is inactive`);
    }

    const dataSchema = getEmailTemplateDataSchema(templateKey);
    if (!dataSchema) {
      throw new InternalServerErrorException(
        `Email template "${templateKey}" has no server-side data schema.`,
      );
    }

    const validation = this.templateValidator.validate({
      subjectTemplate: template.subjectTemplate,
      htmlTemplate: template.htmlTemplate,
      textTemplate: template.textTemplate,
      variables: this.asVariableMap(template.variables),
      dataSchema,
    });

    if (!validation.valid) {
      const details = validation.errors
        .map((issue) => `${issue.field}: ${issue.message}`)
        .join('; ');

      throw new InternalServerErrorException(
        `Stored email template "${templateKey}" is invalid: ${details}`,
      );
    }

    const dataIssues = this.templateValidator.validateData(dataSchema, data);
    if (dataIssues.length > 0) {
      const details = dataIssues
        .map((issue) => `${issue.path} ${issue.message}`)
        .join('; ');

      throw new InternalServerErrorException(
        `Invalid data for email template "${templateKey}": ${details}`,
      );
    }

    try {
      const subjectTemplate = Handlebars.compile(template.subjectTemplate);

      const htmlTemplate = Handlebars.compile(template.htmlTemplate);

      const textTemplate = template.textTemplate
        ? Handlebars.compile(template.textTemplate)
        : null;

      const subject = subjectTemplate(data);
      const html = htmlTemplate(data);
      const text = textTemplate ? textTemplate(data) : undefined;

      if (!subject.trim()) {
        throw new Error('Rendered email subject is empty.');
      }

      const currentVersion = template.versions[0]?.version || 1;

      return {
        subject,
        html,
        text,
        templateVersion: currentVersion,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to render email template "${templateKey}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private asVariableMap(value: unknown): Record<string, unknown> {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }
}
