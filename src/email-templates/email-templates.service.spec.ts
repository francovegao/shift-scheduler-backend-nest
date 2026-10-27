import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EmailTemplateValidationService } from 'src/email/email-template-validation.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailTemplatesService } from './email-templates.service';

describe('EmailTemplatesService', () => {
  const admin = { id: 'admin-id', role: 'admin' };
  const draft = {
    subjectTemplate: 'Shift at {{companyName}}',
    htmlTemplate: '<p>Hello {{pharmacistName}}</p>',
    textTemplate: 'Hello {{pharmacistName}}',
  };
  const template = {
    id: 'template-id',
    key: 'shift_assigned',
    variables: {
      companyName: 'string',
      pharmacistName: 'string',
    },
  };

  let service: EmailTemplatesService;
  let prisma: {
    emailTemplate: { findUnique: jest.Mock; findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let validator: { validate: jest.Mock };

  beforeEach(() => {
    prisma = {
      emailTemplate: { findUnique: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn(),
    };
    validator = { validate: jest.fn() };
    service = new EmailTemplatesService(
      prisma as unknown as PrismaService,
      validator as unknown as EmailTemplateValidationService,
    );
  });

  it('rejects non-admin users before reading templates', async () => {
    await expect(
      service.findAll({ id: 'manager-id', role: 'pharmacy_manager' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.emailTemplate.findMany).not.toHaveBeenCalled();
  });

  it('validates a draft against the stored read-only variable schema', async () => {
    const result = { valid: false, errors: [], warnings: [] };
    prisma.emailTemplate.findUnique.mockResolvedValue(template);
    validator.validate.mockReturnValue(result);

    await expect(service.validate(admin, template.key, draft)).resolves.toEqual(
      result,
    );

    expect(validator.validate).toHaveBeenCalledWith({
      ...draft,
      variables: template.variables,
    });
  });

  it('renders preview content with generated mock values and does not persist', async () => {
    prisma.emailTemplate.findUnique.mockResolvedValue(template);
    validator.validate.mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
    });

    await expect(service.preview(admin, template.key, draft)).resolves.toEqual({
      subject: 'Shift at Test Company',
      html: '<p>Hello Test Pharmacist Name</p>',
      text: 'Hello Test Pharmacist Name',
      warnings: [],
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects invalid updates before opening a transaction', async () => {
    const errors = [
      { field: 'htmlTemplate', message: 'HTML template cannot be empty.' },
    ];
    prisma.emailTemplate.findUnique.mockResolvedValue(template);
    validator.validate.mockReturnValue({ valid: false, errors, warnings: [] });

    await expect(
      service.update(admin, template.key, draft),
    ).rejects.toMatchObject(
      new BadRequestException({
        message: 'Email template draft is invalid.',
        errors,
        warnings: [],
      }),
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('updates the template and creates the next version in one transaction', async () => {
    const tx = {
      emailTemplateVersion: {
        findFirst: jest.fn().mockResolvedValue({ version: 2 }),
        create: jest.fn().mockResolvedValue({ version: 3 }),
      },
      emailTemplate: {
        update: jest.fn().mockResolvedValue({
          ...template,
          ...draft,
          isActive: true,
          updatedById: admin.id,
        }),
      },
    };
    prisma.emailTemplate.findUnique.mockResolvedValue(template);
    validator.validate.mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
    });
    prisma.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx),
    );

    await expect(
      service.update(admin, template.key, { ...draft, isActive: true }),
    ).resolves.toMatchObject({ version: 3, updatedById: admin.id });

    expect(tx.emailTemplate.update).toHaveBeenCalledWith({
      where: { key: template.key },
      data: {
        ...draft,
        isActive: true,
        updatedById: admin.id,
      },
    });
    expect(tx.emailTemplateVersion.create).toHaveBeenCalledWith({
      data: {
        templateId: template.id,
        version: 3,
        ...draft,
        changedById: admin.id,
      },
    });
  });
});
