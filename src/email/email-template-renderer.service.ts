/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Handlebars from 'handlebars';
import { EmailTemplateValidationService } from './email-template-validation.service';

@Injectable()
export class EmailTemplateRendererService {
  constructor(
    private prisma: PrismaService,
    private templateValidator: EmailTemplateValidationService,
  ) {}

  async render(templateKey: string, data: Record<string, any>) {
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

    const validation = this.templateValidator.validate({
      subjectTemplate: template.subjectTemplate,
      htmlTemplate: template.htmlTemplate,
      textTemplate: template.textTemplate,
      variables: this.asVariableMap(template.variables),
    });

    if (!validation.valid) {
      const details = validation.errors
        .map((issue) => `${issue.field}: ${issue.message}`)
        .join('; ');

      throw new InternalServerErrorException(
        `Stored email template "${templateKey}" is invalid: ${details}`,
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
