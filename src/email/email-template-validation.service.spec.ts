import { EmailTemplateValidationService } from './email-template-validation.service';

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
});
