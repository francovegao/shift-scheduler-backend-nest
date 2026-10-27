import { EmailTemplateValidationService } from '../email/email-template-validation.service';

const templateValidator = new EmailTemplateValidationService();

const result = templateValidator.validate({
  subjectTemplate: 'Multiple Shifts Assigned at {{companyName}}',
  htmlTemplate: `
    <p>Hi {{pharmacistFirstName}}</p>
    {{#each shifts}}
      <p>{{date}} - {{startTime}} - {{endTime}}</p>
      <a href="{{gcalLink}}">Add to calendar</a>
    {{/each}}
    <a href="{{portalUrl}}">Log in</a>
  `,
  variables: {
    pharmacistFirstName: 'string',
    companyName: 'string',
    shifts: 'array',
    portalUrl: 'string',
  },
});

console.log(result);
