export type EmailTemplateField = {
  type: 'string' | 'array';
  allowEmpty?: boolean;
  items?: Record<string, EmailTemplateField>;
};

export type EmailTemplateDataSchema = {
  fields: Record<string, EmailTemplateField>;
};

export type EmailTemplateDataIssue = {
  path: string;
  message: string;
};

const stringFields = (
  names: string[],
  allowEmpty: string[] = [],
): Record<string, EmailTemplateField> =>
  Object.fromEntries(
    names.map((name) => [
      name,
      { type: 'string', allowEmpty: allowEmpty.includes(name) },
    ]),
  );

const shiftFields = (
  includeCalendarLink: boolean,
): Record<string, EmailTemplateField> =>
  stringFields(
    [
      'shiftDate',
      'startTime',
      'endTime',
      'title',
      'description',
      ...(includeCalendarLink ? ['gcalLink'] : []),
    ],
    ['description'],
  );

const withShifts = (
  fields: Record<string, EmailTemplateField>,
  includeCalendarLink: boolean,
): EmailTemplateDataSchema => ({
  fields: {
    ...fields,
    shifts: { type: 'array', items: shiftFields(includeCalendarLink) },
  },
});

export const emailTemplateDataSchemas: Record<string, EmailTemplateDataSchema> =
  {
    shift_assigned: {
      fields: stringFields(
        [
          'pharmacistFirstName',
          'companyName',
          'shiftDate',
          'startTime',
          'endTime',
          'shiftTitle',
          'shiftDescription',
          'gcalLink',
          'portalUrl',
        ],
        ['pharmacistFirstName', 'shiftTitle', 'shiftDescription'],
      ),
    },
    shift_taken: {
      fields: stringFields(
        [
          'pharmacistFirstName',
          'companyName',
          'shiftDate',
          'startTime',
          'endTime',
          'shiftTitle',
          'shiftDescription',
          'gcalLink',
          'portalUrl',
        ],
        ['pharmacistFirstName', 'shiftTitle', 'shiftDescription'],
      ),
    },
    notify_shift_taken: {
      fields: stringFields(
        [
          'companyName',
          'pharmacistName',
          'shiftDate',
          'startTime',
          'endTime',
          'shiftTitle',
          'shiftDescription',
          'portalUrl',
        ],
        ['shiftTitle', 'shiftDescription'],
      ),
    },
    multiple_shifts_assigned: withShifts(
      stringFields(
        ['pharmacistFirstName', 'companyName', 'portalUrl'],
        ['pharmacistFirstName'],
      ),
      true,
    ),
    open_shift_manual_notification: {
      fields: stringFields(
        [
          'companyName',
          'shiftDate',
          'startTime',
          'endTime',
          'shiftTitle',
          'shiftDescription',
          'portalUrl',
        ],
        ['shiftTitle', 'shiftDescription'],
      ),
    },
    multiple_open_shifts_manual_notification: {
      fields: stringFields(
        ['pharmacistFirstName', 'portalUrl'],
        ['pharmacistFirstName'],
      ),
    },
    taken_shift_updated: {
      fields: stringFields(
        [
          'companyName',
          'shiftDate',
          'startTime',
          'endTime',
          'shiftTitle',
          'shiftDescription',
          'gcalLink',
          'portalUrl',
        ],
        ['shiftTitle', 'shiftDescription'],
      ),
    },
    request_shift_cancellation: {
      fields: stringFields(
        [
          'companyName',
          'shiftDate',
          'startTime',
          'endTime',
          'shiftTitle',
          'shiftDescription',
          'pharmacistName',
          'pharmacistEmail',
          'cancellationReason',
          'portalUrl',
        ],
        ['shiftTitle', 'shiftDescription'],
      ),
    },
    taken_shift_cancelled: {
      fields: stringFields(
        [
          'companyName',
          'shiftDate',
          'startTime',
          'endTime',
          'shiftTitle',
          'shiftDescription',
          'portalUrl',
        ],
        ['shiftTitle', 'shiftDescription'],
      ),
    },
    shift_series_assigned: withShifts(
      stringFields(['companyName', 'portalUrl']),
      true,
    ),
    taken_shift_series_updated: withShifts(
      stringFields(['companyName', 'portalUrl']),
      true,
    ),
    taken_shift_series_cancelled: withShifts(
      stringFields(['companyName', 'portalUrl']),
      true,
    ),
    cancel_request_rejected: {
      fields: stringFields(
        [
          'companyName',
          'shiftDate',
          'startTime',
          'endTime',
          'shiftTitle',
          'shiftDescription',
          'portalUrl',
        ],
        ['shiftTitle', 'shiftDescription'],
      ),
    },
    cancel_request_approved: {
      fields: stringFields(
        [
          'companyName',
          'shiftDate',
          'startTime',
          'endTime',
          'shiftTitle',
          'shiftDescription',
          'portalUrl',
        ],
        ['shiftTitle', 'shiftDescription'],
      ),
    },
    new_account_created: {
      fields: stringFields(['firstName', 'resetLink'], ['firstName']),
    },
    new_pharmacist_request: {
      fields: stringFields([
        'pharmacistFirstName',
        'pharmacistLastName',
        'pharmacistEmail',
        'submittedByName',
        'portalUrl',
      ]),
    },
    pharmacist_request_approved: {
      fields: stringFields([
        'pharmacistFirstName',
        'pharmacistLastName',
        'pharmacistEmail',
        'portalUrl',
      ]),
    },
    pharmacist_request_rejected: {
      fields: stringFields([
        'pharmacistFirstName',
        'pharmacistLastName',
        'pharmacistEmail',
        'portalUrl',
      ]),
    },
    password_reset: { fields: stringFields(['resetLink']) },
  };

export function getEmailTemplateDataSchema(templateKey: string) {
  return emailTemplateDataSchemas[templateKey];
}

export function validateEmailTemplateData(
  schema: EmailTemplateDataSchema,
  data: Record<string, unknown>,
): EmailTemplateDataIssue[] {
  const issues: EmailTemplateDataIssue[] = [];

  for (const [name, field] of Object.entries(schema.fields)) {
    const value = data[name];
    validateField(name, value, field, issues);
  }

  return issues;
}

export function createEmailTemplatePreviewData(
  schema: EmailTemplateDataSchema,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(schema.fields).map(([name, field]) => [
      name,
      createPreviewValue(name, field),
    ]),
  );
}

function validateField(
  path: string,
  value: unknown,
  field: EmailTemplateField,
  issues: EmailTemplateDataIssue[],
): void {
  if (value === null || value === undefined) {
    issues.push({ path, message: 'is required.' });
    return;
  }

  if (field.type === 'string') {
    if (typeof value !== 'string') {
      issues.push({ path, message: 'must be a string.' });
    } else if (!field.allowEmpty && !value.trim()) {
      issues.push({ path, message: 'cannot be empty.' });
    }
    return;
  }

  if (!Array.isArray(value)) {
    issues.push({ path, message: 'must be an array.' });
    return;
  }

  if (value.length === 0) {
    issues.push({ path, message: 'must contain at least one item.' });
    return;
  }

  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      issues.push({ path: `${path}[${index}]`, message: 'must be an object.' });
      continue;
    }

    for (const [itemName, itemField] of Object.entries(field.items ?? {})) {
      validateField(
        `${path}[${index}].${itemName}`,
        (item as Record<string, unknown>)[itemName],
        itemField,
        issues,
      );
    }
  }
}

function createPreviewValue(name: string, field: EmailTemplateField): unknown {
  if (field.type === 'array') {
    return [
      Object.fromEntries(
        Object.entries(field.items ?? {}).map(([itemName, itemField]) => [
          itemName,
          createPreviewValue(itemName, itemField),
        ]),
      ),
    ];
  }

  const values: Record<string, string> = {
    companyName: 'Test Company',
    pharmacistName: 'Test Pharmacist Name',
    pharmacistFirstName: 'Test Pharmacist',
    pharmacistLastName: 'Name',
    pharmacistEmail: 'test.pharmacist@example.com',
    portalUrl: 'https://example.test/portal',
    resetLink: 'https://example.test/reset-password',
    gcalLink: 'https://calendar.google.com/',
    shiftDate: 'January 15, 2030',
    startTime: '9:00 AM',
    endTime: '5:00 PM',
    shiftTitle: 'Test Shift',
    title: 'Test Shift',
    shiftDescription: 'Test shift description',
    description: 'Test shift description',
    cancellationReason: 'Test cancellation reason',
    submittedByName: 'Test Admin',
    firstName: 'Test User',
  };

  return values[name] ?? `Test ${formatVariableName(name)}`;
}

function formatVariableName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (value) => value.toUpperCase());
}
