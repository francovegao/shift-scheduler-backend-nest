import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EmailTemplateValidationService } from 'src/email/email-template-validation.service';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailTemplatesService } from './email-templates.service';

describe('EmailTemplatesService', () => {
  const admin = { id: 'admin-id', role: 'admin' };
  const draft = {
    subjectTemplate: 'Shift at {{companyName}}',
    htmlTemplate: '<p>Hello {{pharmacistFirstName}}</p>',
    textTemplate: 'Hello {{pharmacistFirstName}}',
  };
  const template = {
    id: 'template-id',
    key: 'shift_assigned',
    variables: {
      companyName: 'string',
      pharmacistFirstName: 'string',
    },
  };

  let service: EmailTemplatesService;
  let prisma: {
    emailTemplate: { findUnique: jest.Mock; findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let validator: { validate: jest.Mock };
  let emailService: { sendTestEmail: jest.Mock };

  beforeEach(() => {
    prisma = {
      emailTemplate: { findUnique: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn(),
    };
    validator = { validate: jest.fn() };
    emailService = { sendTestEmail: jest.fn() };
    service = new EmailTemplatesService(
      prisma as unknown as PrismaService,
      validator as unknown as EmailTemplateValidationService,
      emailService as unknown as EmailService,
    );
  });

  it('rejects non-admin users before reading templates', async () => {
    await expect(
      service.findAll({ id: 'manager-id', role: 'pharmacy_manager' }, {}),
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

    expect(validator.validate).toHaveBeenCalledWith(
      expect.objectContaining({
        ...draft,
        variables: template.variables,
      }),
    );
  });

  it('renders preview content with generated mock values and does not persist', async () => {
    prisma.emailTemplate.findUnique.mockResolvedValue(template);
    validator.validate.mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
    });

    await expect(service.preview(admin, template.key, draft)).resolves.toEqual({
      data: {
        subject: 'Shift at Test Company',
        html: '<p>Hello Test Pharmacist</p>',
        text: 'Hello Test Pharmacist',
        warnings: [],
      },
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

  it('rejects invalid Handlebars and undeclared variables without updating', async () => {
    const realValidator = new EmailTemplateValidationService();
    service = new EmailTemplatesService(
      prisma as unknown as PrismaService,
      realValidator,
      emailService as unknown as EmailService,
    );
    prisma.emailTemplate.findUnique.mockResolvedValue(template);

    await expect(
      service.update(admin, template.key, {
        ...draft,
        htmlTemplate: '{{#each shifts}}',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.update(admin, template.key, {
        ...draft,
        htmlTemplate: '<p>{{undeclaredVariable}}</p>',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects non-admin users from update and preview', async () => {
    await expect(
      service.update(
        { id: 'manager-id', role: 'pharmacy_manager' },
        template.key,
        draft,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.preview(
        { id: 'manager-id', role: 'pharmacy_manager' },
        template.key,
        draft,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.emailTemplate.findUnique).not.toHaveBeenCalled();
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
    ).resolves.toMatchObject({
      data: { version: 3, updatedById: admin.id },
    });

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

  it('propagates a version-write failure from the transaction', async () => {
    const tx = {
      emailTemplateVersion: {
        findFirst: jest.fn().mockResolvedValue({ version: 2 }),
        create: jest.fn().mockRejectedValue(new Error('version insert failed')),
      },
      emailTemplate: {
        update: jest.fn().mockResolvedValue({ ...template, ...draft }),
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

    await expect(service.update(admin, template.key, draft)).rejects.toThrow(
      'version insert failed',
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.emailTemplate.update).toHaveBeenCalledTimes(1);
    expect(tx.emailTemplateVersion.create).toHaveBeenCalledTimes(1);
  });

  it('renders and sends a valid unsaved draft to the requested test recipient', async () => {
    prisma.emailTemplate.findUnique.mockResolvedValue(template);
    validator.validate.mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
    });
    emailService.sendTestEmail.mockResolvedValue({
      id: 'provider-email-id',
      subject: 'Shift at Test Company',
    });

    await expect(
      service.sendTestEmail(admin, template.key, {
        ...draft,
        recipientEmail: 'admin@example.com',
      }),
    ).resolves.toEqual({
      data: {
        id: 'provider-email-id',
        subject: 'Shift at Test Company',
        warnings: [],
      },
    });

    expect(emailService.sendTestEmail).toHaveBeenCalledWith({
      templateKey: template.key,
      to: 'admin@example.com',
      subject: 'Shift at Test Company',
      html: '<p>Hello Test Pharmacist</p>',
      text: 'Hello Test Pharmacist',
    });
  });

  it('does not send an invalid draft as a test email', async () => {
    const errors = [{ field: 'htmlTemplate', message: 'Invalid syntax.' }];
    prisma.emailTemplate.findUnique.mockResolvedValue(template);
    validator.validate.mockReturnValue({ valid: false, errors, warnings: [] });

    await expect(
      service.sendTestEmail(admin, template.key, {
        ...draft,
        recipientEmail: 'admin@example.com',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(emailService.sendTestEmail).not.toHaveBeenCalled();
  });
});
