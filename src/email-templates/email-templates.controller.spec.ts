import { EmailTemplatesController } from './email-templates.controller';
import { EmailTemplatesService } from './email-templates.service';

describe('EmailTemplatesController', () => {
  const admin = { id: 'admin-id', role: 'admin' };
  const draft = {
    subjectTemplate: 'Subject',
    htmlTemplate: '<p>Body</p>',
  };
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    validate: jest.fn(),
    preview: jest.fn(),
  };
  const controller = new EmailTemplatesController(
    service as unknown as EmailTemplatesService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('passes the authenticated user, key, and draft to preview', async () => {
    await controller.preview(admin, 'shift_assigned', draft);

    expect(service.preview).toHaveBeenCalledWith(
      admin,
      'shift_assigned',
      draft,
    );
  });

  it('passes the authenticated user, key, and update DTO to update', async () => {
    await controller.update(admin, 'shift_assigned', draft);

    expect(service.update).toHaveBeenCalledWith(admin, 'shift_assigned', draft);
  });
});
