import { EmailTemplateValidationService } from './email-template-validation.service';
import { getEmailTemplateDataSchema } from './email-template-data.schema';

describe('EmailTemplateValidationService', () => {
  let validator: EmailTemplateValidationService;

  beforeEach(() => {
    validator = new EmailTemplateValidationService();
  });

  const variables = {
    pharmacistFirstName: 'string',
    companyName: 'string',
    shifts: 'array',
    portalUrl: 'string',
  };

  it('accepts a valid template with an each block', () => {
    const result = validator.validate({
      subjectTemplate: 'Multiple Shifts Assigned at {{companyName}}',
      htmlTemplate: `
        <p>Hello {{pharmacistFirstName}}</p>
        {{#each shifts}}
          <p>{{date}}: {{startTime}} - {{endTime}}</p>
          <p>{{description}}</p>
        {{/each}}
        <a href="{{portalUrl}}">Log in</a>
      `,
      textTemplate: `
        Hello {{pharmacistFirstName}}
        {{#each shifts}}
          {{date}}: {{startTime}} - {{endTime}}
        {{/each}}
      `,
      variables,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects an undeclared root variable', () => {
    const result = validator.validate({
      subjectTemplate: 'Shift at {{companyNmae}}',
      htmlTemplate: '<p>Hello {{pharmacistFirstName}}</p>',
      variables,
    });

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) => error.message.includes('companyNmae')),
    ).toBe(true);
  });

  it('rejects malformed Handlebars syntax', () => {
    const result = validator.validate({
      subjectTemplate: 'Shift Assigned',
      htmlTemplate: '{{#each shifts}}<p>{{date}}</p>',
      variables,
    });

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) =>
        error.message.includes('Invalid Handlebars syntax'),
      ),
    ).toBe(true);
  });

  it('rejects an empty subject', () => {
    const result = validator.validate({
      subjectTemplate: '   ',
      htmlTemplate: '<p>Hello</p>',
      variables: {},
    });

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) => error.field === 'subjectTemplate'),
    ).toBe(true);
  });

  it('allows the text template to be omitted', () => {
    const result = validator.validate({
      subjectTemplate: 'Shift Assigned at {{companyName}}',
      htmlTemplate: '<p>Hello {{pharmacistFirstName}}</p>',
      variables: {
        companyName: 'string',
        pharmacistFirstName: 'string',
      },
    });

    expect(result.valid).toBe(true);
  });

  it('accepts declared shift item fields inside an each block', () => {
    const result = validator.validate({
      subjectTemplate: 'Shifts at {{companyName}}',
      htmlTemplate:
        '{{#each shifts}}{{shiftDate}} {{startTime}} {{gcalLink}}{{/each}}',
      variables: {
        companyName: 'string',
        shifts: { type: 'array', items: { shiftDate: 'string' } },
      },
      dataSchema: getEmailTemplateDataSchema('multiple_shifts_assigned'),
    });

    expect(result.valid).toBe(true);
  });

  it('rejects undeclared shift item fields inside an each block', () => {
    const result = validator.validate({
      subjectTemplate: 'Shifts at {{companyName}}',
      htmlTemplate: '{{#each shifts}}{{unknownItemField}}{{/each}}',
      variables: {
        companyName: 'string',
        shifts: { type: 'array', items: {} },
      },
      dataSchema: getEmailTemplateDataSchema('multiple_shifts_assigned'),
    });

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) => error.message.includes('unknownItemField')),
    ).toBe(true);
  });

  it('validates runtime shift item data through the shared service API', () => {
    const schema = getEmailTemplateDataSchema('multiple_shifts_assigned');
    if (!schema) throw new Error('Expected template schema');

    const issues = validator.validateData(schema, {
      pharmacistFirstName: 'Ada',
      companyName: 'Test Company',
      portalUrl: 'https://example.test/portal',
      shifts: [{ shiftDate: 'January 15, 2030' }],
    });

    expect(issues).toContainEqual(
      expect.objectContaining({ path: 'shifts[0].startTime' }),
    );
  });
});
