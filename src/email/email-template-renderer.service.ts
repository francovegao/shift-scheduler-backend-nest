import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Handlebars from 'handlebars';

@Injectable()
export class EmailTemplateRendererService {
  constructor(private prisma: PrismaService) {}

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

    const subjectTemplate = Handlebars.compile(template.subjectTemplate);

    const htmlTemplate = Handlebars.compile(template.htmlTemplate);

    const textTemplate = template.textTemplate
      ? Handlebars.compile(template.textTemplate)
      : null;

    const currentVersion = template.versions[0]?.version || 1;

    return {
      subject: subjectTemplate(data),
      html: htmlTemplate(data),
      text: textTemplate ? textTemplate(data) : undefined,
      templateVersion: currentVersion,
    };
  }
}
