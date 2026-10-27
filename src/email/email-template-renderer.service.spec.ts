import { InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailTemplateValidationService } from './email-template-validation.service';
import { EmailTemplateRendererService } from './email-template-renderer.service';

describe('EmailTemplateRendererService', () => {
  const data = {
    pharmacistFirstName: 'Ada',
    companyName: 'Test Company',
    shiftDate: 'January 15, 2030',
    startTime: '9:00 AM',
    endTime: '5:00 PM',
    shiftTitle: 'Test Shift',
    shiftDescription: '',
    gcalLink: 'https://calendar.google.com/',
    portalUrl: 'https://example.test/portal',
  };

  const template = {
    key: 'shift_assigned',
    isActive: true,
    subjectTemplate: 'Shift at {{companyName}}',
    htmlTemplate: '<p>{{pharmacistFirstName}}</p>',
    textTemplate: '{{shiftDate}}',
    variables: {
      pharmacistFirstName: 'string',
      companyName: 'string',
      shiftDate: 'string',
      startTime: 'string',
      endTime: 'string',
      shiftTitle: 'string',
      shiftDescription: 'string',
      gcalLink: 'string',
      portalUrl: 'string',
    },
    versions: [{ version: 3 }],
  };

  let renderer: EmailTemplateRendererService;
  let prisma: { emailTemplate: { findUnique: jest.Mock } };

  beforeEach(() => {
    prisma = { emailTemplate: { findUnique: jest.fn() } };
    renderer = new EmailTemplateRendererService(
      prisma as unknown as PrismaService,
      new EmailTemplateValidationService(),
    );
  });

  it('rejects inactive templates before rendering', async () => {
    prisma.emailTemplate.findUnique.mockResolvedValue({
      ...template,
      isActive: false,
    });

    await expect(renderer.render(template.key, data)).rejects.toThrow(
      'inactive',
    );
  });

  it('rejects missing required runtime data', async () => {
    prisma.emailTemplate.findUnique.mockResolvedValue(template);
    const missingCompany = { ...data, companyName: undefined };

    await expect(
      renderer.render(template.key, missingCompany),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('rejects malformed shift array items before rendering', async () => {
    prisma.emailTemplate.findUnique.mockResolvedValue({
      key: 'multiple_shifts_assigned',
      isActive: true,
      subjectTemplate: 'Shifts at {{companyName}}',
      htmlTemplate: '{{#each shifts}}{{shiftDate}}{{/each}}',
      textTemplate: null,
      variables: {
        pharmacistFirstName: 'string',
        companyName: 'string',
        shifts: { type: 'array', items: { shiftDate: 'string' } },
        portalUrl: 'string',
      },
      versions: [{ version: 2 }],
    });

    await expect(
      renderer.render('multiple_shifts_assigned', {
        pharmacistFirstName: 'Ada',
        companyName: 'Test Company',
        portalUrl: 'https://example.test/portal',
        shifts: [{ shiftDate: 'January 15, 2030' }],
      }),
    ).rejects.toThrow('shifts[0].startTime is required');
  });

  it('returns the version and latest template content from the database', async () => {
    prisma.emailTemplate.findUnique
      .mockResolvedValueOnce(template)
      .mockResolvedValueOnce({
        ...template,
        subjectTemplate: 'Updated shift at {{companyName}}',
        versions: [{ version: 4 }],
      });

    await expect(renderer.render(template.key, data)).resolves.toMatchObject({
      subject: 'Shift at Test Company',
      templateVersion: 3,
    });
    await expect(renderer.render(template.key, data)).resolves.toMatchObject({
      subject: 'Updated shift at Test Company',
      templateVersion: 4,
    });
  });

  it('rejects an empty rendered subject', async () => {
    prisma.emailTemplate.findUnique.mockResolvedValue({
      ...template,
      subjectTemplate: '{{pharmacistFirstName}}',
    });

    await expect(
      renderer.render(template.key, { ...data, pharmacistFirstName: '' }),
    ).rejects.toThrow('Rendered email subject is empty');
  });
});
