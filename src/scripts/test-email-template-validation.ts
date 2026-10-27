import { EmailTemplateValidationService } from '../email/email-template-validation.service';
import { getEmailTemplateDataSchema } from '../email/email-template-data.schema';

const templateValidator = new EmailTemplateValidationService();

const result = templateValidator.validate({
  subjectTemplate: 'Multiple Shifts Assigned at {{companyName}}',
  htmlTemplate: `
    <p>Hi {{pharmacistFirstName}}</p>
    {{#each shifts}}
      <p>{{shiftDate}} - {{startTime}} - {{endTime}}</p>
      <a href="{{gcalLink}}">Add to calendar</a>
    {{/each}}
    <a href="{{portalUrl}}">Log in</a>
  `,
  variables: {
    pharmacistFirstName: 'string',
    companyName: 'string',
    shifts: {
      type: 'array',
      items: {
        shiftDate: 'string',
        startTime: 'string',
        endTime: 'string',
        title: 'string',
        description: 'string',
        gcalLink: 'string',
      },
    },
    portalUrl: 'string',
  },
  dataSchema: getEmailTemplateDataSchema('multiple_shifts_assigned'),
});

console.log(result);
