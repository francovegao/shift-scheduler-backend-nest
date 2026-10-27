import { PrismaService } from 'src/prisma/prisma.service';
import { EmailTemplateRendererService } from './email-template-renderer.service';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let renderer: { render: jest.Mock };
  let resend: { emails: { send: jest.Mock }; batch: { send: jest.Mock } };

  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test_key';
    renderer = { render: jest.fn() };
    service = new EmailService(
      {
        emailLog: { create: jest.fn().mockResolvedValue({}) },
      } as unknown as PrismaService,
      renderer as unknown as EmailTemplateRendererService,
    );
    resend = {
      emails: {
        send: jest
          .fn()
          .mockResolvedValue({ data: { id: 'email-id' }, error: null }),
      },
      batch: { send: jest.fn() },
    };
    (service as unknown as { resend: typeof resend }).resend = resend;
  });

  it('sends the latest renderer content on subsequent sends', async () => {
    renderer.render
      .mockResolvedValueOnce({
        subject: 'Original password reset',
        html: '<p>Original</p>',
        text: 'Original',
        templateVersion: 1,
      })
      .mockResolvedValueOnce({
        subject: 'Updated password reset',
        html: '<p>Updated</p>',
        text: 'Updated',
        templateVersion: 2,
      });

    await service.sendPasswordResetEmail(
      'user@example.com',
      'https://example.test/reset',
    );
    await service.sendPasswordResetEmail(
      'user@example.com',
      'https://example.test/reset',
    );

    expect(resend.emails.send).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ subject: 'Original password reset' }),
    );
    expect(resend.emails.send).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ subject: 'Updated password reset' }),
    );
  });

  it('does not call Resend when the renderer rejects invalid data', async () => {
    renderer.render.mockRejectedValue(
      new Error('Invalid data for email template'),
    );

    await expect(
      service.sendPasswordResetEmail(
        'user@example.com',
        'https://example.test/reset',
      ),
    ).rejects.toThrow('Invalid data for email template');

    expect(resend.emails.send).not.toHaveBeenCalled();
  });
});
