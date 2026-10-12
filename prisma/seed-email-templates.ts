/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const templates = [
  {
    key: 'shift_assigned',
    name: 'Shift Assigned',
    description:
      'Sent to pharmacist when assigned a single shift by admin/manager',
    subjectTemplate: 'Shift Assigned at {{companyName}}',
    htmlTemplate: `<p>Hi {{pharmacistFirstName}},</p>
<p>This email confirms that you have been assigned a shift at <strong>{{companyName}}</strong></p>
<p><strong>Shift Details</strong><br>
Location: <strong>{{companyName}}</strong><br>
Date: <strong>{{shiftDate}}</strong><br>
Time: <strong>{{startTime}} - {{endTime}}</strong><br>
Notes: {{shiftTitle}}<br>
{{shiftDescription}}</p>
<a href="{{gcalLink}}">
Click here to add shift
to Google Calendar</a>
<p>We'll reach out <strong>24 hours before your shift</strong> with your pharmacy access codes and login details.<br>
Once you get to the store, you'll find a <strong>location-specific Pharmacist Relief Binder</strong> with<br>
guidance on workflows, procedures, and key contacts to help your shift run smoothly.</p>
<p>If you have any questions or concerns, please reach out to the Pharmacy manager. You will find<br>
the contact information located in the accepted shift on the portal.<br>
<a href="{{portalUrl}}">Click here to log in</a></p>
<p>Thank you for supporting our pharmacy network.</p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `Hi {{pharmacistFirstName}},

This email confirms that you have been assigned a shift at {{companyName}}

Shift Details
Location: {{companyName}}
Date: {{shiftDate}}
Time: {{startTime}} - {{endTime}}
Notes: {{shiftTitle}}
{{shiftDescription}}

Click here to add shift to Google Calendar: {{gcalLink}}

We'll reach out 24 hours before your shift with your pharmacy access codes and login details.
Once you get to the store, you'll find a location-specific Pharmacist Relief Binder with
guidance on workflows, procedures, and key contacts to help your shift run smoothly.

If you have any questions or concerns, please reach out to the Pharmacy manager. You will find
the contact information located in the accepted shift on the portal.
Click here to log in: {{portalUrl}}

Thank you for supporting our pharmacy network.

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
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
    allowManualSend: false,
    isActive: true,
  },
  {
    key: 'shift_taken',
    name: 'Shift Taken',
    description: 'Sent to pharmacist when they manually take a shift',
    subjectTemplate: 'New Shift: Shift Confirmed at {{companyName}}',
    htmlTemplate: `<p>Hi {{pharmacistFirstName}},</p>
<p>This email confirms that you have successfully accepted a shift at <strong>{{companyName}}</strong></p>
<p><strong>Shift Details</strong><br>
Location: <strong>{{companyName}}</strong><br>
Date: <strong>{{shiftDate}}</strong><br>
Time: <strong>{{startTime}} - {{endTime}}</strong><br>
Notes: {{shiftTitle}}<br>
{{shiftDescription}}</p>
<a href="{{gcalLink}}">
Click here to add shift to Google Calendar</a>
<p>We'll reach out <strong>24 hours before your shift</strong> with your pharmacy access codes and login details.<br>
Once you get to the store, you'll find a <strong>location-specific Pharmacist Relief Binder</strong> with<br>
guidance on workflows, procedures, and key contacts to help your shift run smoothly.</p>
<p>If you have any questions or concerns, please reach out to the Pharmacy manager. You will find<br>
the contact information located in the accepted shift on the portal.<br>
<a href="{{portalUrl}}">Click here to log in</a></p>
<p>Thank you for supporting our pharmacy network.</p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `Hi {{pharmacistFirstName}},

This email confirms that you have successfully accepted a shift at {{companyName}}

Shift Details
Location: {{companyName}}
Date: {{shiftDate}}
Time: {{startTime}} - {{endTime}}
Notes: {{shiftTitle}}
{{shiftDescription}}

Click here to add shift to Google Calendar: {{gcalLink}}

We'll reach out 24 hours before your shift with your pharmacy access codes and login details.
Once you get to the store, you'll find a location-specific Pharmacist Relief Binder with
guidance on workflows, procedures, and key contacts to help your shift run smoothly.

If you have any questions or concerns, please reach out to the Pharmacy manager. You will find
the contact information located in the accepted shift on the portal.
Click here to log in: {{portalUrl}}

Thank you for supporting our pharmacy network.

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
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
    allowManualSend: false,
    isActive: true,
  },
  {
    key: 'notify_shift_taken',
    name: 'Notify Shift Taken',
    description: 'Sent to managers/admins when a pharmacist takes a shift',
    subjectTemplate: 'New Shift Assigned at {{companyName}}',
    htmlTemplate: `<p>A pharmacist has taken a shift at <strong>{{companyName}}</strong><br>
Pharmacist name: <strong>{{pharmacistName}}</strong></p>
<p>Shift Information<br>
Date: <strong>{{shiftDate}}</strong><br>
From: <strong>{{startTime}}</strong><br>
To: <strong>{{endTime}}</strong><br>
Notes: {{shiftTitle}}<br>
{{shiftDescription}}</p>
<p>To view all the details go to
<a href="{{portalUrl}}">Shift Happens.</a></p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `A pharmacist has taken a shift at {{companyName}}
Pharmacist name: {{pharmacistName}}

Shift Information
Date: {{shiftDate}}
From: {{startTime}}
To: {{endTime}}
Notes: {{shiftTitle}}
{{shiftDescription}}

To view all the details go to Shift Happens: {{portalUrl}}

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      companyName: 'string',
      pharmacistName: 'string',
      shiftDate: 'string',
      startTime: 'string',
      endTime: 'string',
      shiftTitle: 'string',
      shiftDescription: 'string',
      portalUrl: 'string',
    },
    allowManualSend: false,
    isActive: true,
  },
  {
    key: 'multiple_shifts_assigned',
    name: 'Multiple Shifts Assigned',
    description:
      'Sent to pharmacist when assigned multiple shifts via shift series or bulk creation',
    subjectTemplate: 'Multiple Shifts Assigned at {{companyName}}',
    htmlTemplate: `<p>Hi {{pharmacistFirstName}},</p>
<p>This email confirms that you have been assigned multiple shifts at <strong>{{companyName}}</strong></p>
<p><strong>Assigned Shifts Details</strong><br>
{{#each shifts}} 
  <div style="margin-bottom: 15px; padding: 10px; border-left: 4px solid #f44336; background: #fafafa;">
    <p style="margin: 0;">Date: <strong>{{date}}</strong></p>
    <p style="margin: 0;">Time: <strong>{{startTime}} - {{endTime}}</strong></p>
    <p style="margin: 0;">Notes: {{title}}</p> <p style="margin: 0;">{{description}}</p>
    <p style="margin: 8px 0 0;"> 
      <a href="{{gcalLink}}">Add shift to Google Calendar</a> 
    </p> 
  </div> 
{{/each}}
<p>We'll reach out <strong>24 hours before your shifts</strong> with your pharmacy access codes and login details.<br>
Once you get to the store, you'll find a <strong>location-specific Pharmacist Relief Binder</strong> with<br>
guidance on workflows, procedures, and key contacts to help your shift run smoothly.</p>
<p>If you have any questions or concerns, please reach out to the Pharmacy manager. You will find<br>
the contact information located in the accepted shift on the portal.<br>
<a href="{{portalUrl}}">Click here to log in</a></p>
<p>Thank you for supporting our pharmacy network.</p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `Hi {{pharmacistFirstName}},

This email confirms that you have been assigned multiple shifts at {{companyName}}

Assigned Shifts Details

{{#each shifts}} 
Date: {{date}} 
Time: {{startTime}} - {{endTime}} 
Notes: {{title}} 
{{description}} 
Add shift to Google Calendar: {{gcalLink}} 

{{/each}}
We'll reach out 24 hours before your shifts with your pharmacy access codes and login details.
Once you get to the store, you'll find a location-specific Pharmacist Relief Binder with
guidance on workflows, procedures, and key contacts to help your shift run smoothly.

If you have any questions or concerns, please reach out to the Pharmacy manager. You will find
the contact information located in the accepted shift on the portal.
Click here to log in: {{portalUrl}}

Thank you for supporting our pharmacy network.

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      pharmacistFirstName: 'string',
      companyName: 'string',
      shifts: 'array',
      portalUrl: 'string',
    },
    allowManualSend: false,
    isActive: true,
  },
  {
    key: 'open_shift_manual_notification',
    name: 'Open Shift Manual Notification',
    description:
      'Sent by admin to notify pharmacists about a specific open shift',
    subjectTemplate: 'Shift Open at {{companyName}}',
    htmlTemplate: `<p>There is an open shift at <strong>{{companyName}}</strong>.</p>
<h3>Shift Information</h3>
<p>Date: <strong>{{shiftDate}}</strong><br>
From: <strong>{{startTime}}</strong><br>
To: <strong>{{endTime}}</strong><br>
Notes: {{shiftTitle}}<br>
{{shiftDescription}}</p>
<p>If you would like to take this shift go to
<a href="{{portalUrl}}">Shift Happens.</a></p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `There is an open shift at {{companyName}}.

Shift Information
Date: {{shiftDate}}
From: {{startTime}}
To: {{endTime}}
Notes: {{shiftTitle}}
{{shiftDescription}}

If you would like to take this shift go to Shift Happens: {{portalUrl}}

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      companyName: 'string',
      shiftDate: 'string',
      startTime: 'string',
      endTime: 'string',
      shiftTitle: 'string',
      shiftDescription: 'string',
      portalUrl: 'string',
    },
    allowManualSend: true,
    isActive: true,
  },
  {
    key: 'multiple_open_shifts_manual_notification',
    name: 'Multiple Open Shifts Manual Notification',
    description:
      'Sent by admin to notify pharmacists about multiple open shifts',
    subjectTemplate: 'Open shifts - Now Available',
    htmlTemplate: `<p>Hi {{pharmacistFirstName}},</p>
<p>Open shifts are now available!</p>
<p>Visit your dashboard to view details and claim shifts!<br>
<a href="{{portalUrl}}">Click here</a> to view available shifts and add to your calendar</p>
<p>Any questions about accepting shifts, please reach out!</p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `Hi {{pharmacistFirstName}},

Open shifts are now available!

Visit your dashboard to view details and claim shifts!
Click here to view available shifts and add to your calendar: {{portalUrl}}

Any questions about accepting shifts, please reach out!

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      pharmacistFirstName: 'string',
      portalUrl: 'string',
    },
    allowManualSend: true,
    isActive: true,
  },
  {
    key: 'taken_shift_updated',
    name: 'Taken Shift Updated',
    description:
      'Sent to pharmacist when an assigned shift start/end times are updated',
    subjectTemplate: 'Shift Updated at {{companyName}}',
    htmlTemplate: `<p>Your assigned shift at <strong>{{companyName}}</strong> was updated.</p>
<p>Updated Shift Information<br>
Date: <strong>{{shiftDate}}</strong><br>
From: <strong>{{startTime}}</strong><br>
To: <strong>{{endTime}}</strong><br>
Notes: {{shiftTitle}}<br>
{{shiftDescription}}</p>
<a href="{{gcalLink}}">
Click here to add shift
to Google Calendar</a>
<p>To view all the details go to
<a href="{{portalUrl}}">Shift Happens.</a></p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `Your assigned shift at {{companyName}} was updated.

Updated Shift Information
Date: {{shiftDate}}
From: {{startTime}}
To: {{endTime}}
Notes: {{shiftTitle}}
{{shiftDescription}}

Click here to add shift to Google Calendar: {{gcalLink}}

To view all the details go to Shift Happens: {{portalUrl}}

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      companyName: 'string',
      shiftDate: 'string',
      startTime: 'string',
      endTime: 'string',
      shiftTitle: 'string',
      shiftDescription: 'string',
      gcalLink: 'string',
      portalUrl: 'string',
    },
    allowManualSend: false,
    isActive: true,
  },
  {
    key: 'request_shift_cancellation',
    name: 'Request Shift Cancellation',
    description:
      'Sent to admins/contact persons when a pharmacist requests to cancel a shift',
    subjectTemplate: 'Request to cancel shift at {{companyName}}',
    htmlTemplate: `<p>A pharmacist wants to cancel a shift at <strong>{{companyName}}</strong>.</p>
<h3>Shift Information</h3>
<p>Date: <strong>{{shiftDate}}</strong><br>
From: <strong>{{startTime}}</strong><br>
To: <strong>{{endTime}}</strong><br>
Notes: {{shiftTitle}}<br>
{{shiftDescription}}</p>
<h3>Pharmacist Information</h3>
<p>Name: <strong>{{pharmacistName}}</strong><br>
email: <strong>{{pharmacistEmail}}</strong></p>
<h3>Cancel Reason</h3>
<p>Reason: <strong>{{cancellationReason}}</strong><br>
<p>To review this request, please log in to
<a href="{{portalUrl}}">Shift Happens.</a> and
process the request.</p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `A pharmacist wants to cancel a shift at {{companyName}}.

Shift Information
Date: {{shiftDate}}
From: {{startTime}}
To: {{endTime}}
Notes: {{shiftTitle}}
{{shiftDescription}}

Pharmacist Information
Name: {{pharmacistName}}
email: {{pharmacistEmail}}

Cancel Reason
Reason: {{cancellationReason}}

To review this request, please log in to Shift Happens: {{portalUrl}} and process the request.

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      companyName: 'string',
      shiftDate: 'string',
      startTime: 'string',
      endTime: 'string',
      shiftTitle: 'string',
      shiftDescription: 'string',
      pharmacistName: 'string',
      pharmacistEmail: 'string',
      cancellationReason: 'string',
      portalUrl: 'string',
    },
    allowManualSend: false,
    isActive: true,
  },
  {
    key: 'taken_shift_cancelled',
    name: 'Taken Shift Cancelled',
    description:
      'Sent to pharmacist when their assigned shift is cancelled or reassigned',
    subjectTemplate: 'Shift Cancelled at {{companyName}}',
    htmlTemplate: `<p>You no longer have a shift at <strong>{{companyName}}</strong></p>
<p>Cancelled Shift Information<br>
Date: <strong>{{shiftDate}}</strong><br>
From: <strong>{{startTime}}</strong><br>
To: <strong>{{endTime}}</strong><br>
Notes: {{shiftTitle}}<br>
{{shiftDescription}}</p>
<p>To view all the details go to
<a href="{{portalUrl}}">Shift Happens.</a></p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `You no longer have a shift at {{companyName}}

Cancelled Shift Information
Date: {{shiftDate}}
From: {{startTime}}
To: {{endTime}}
Notes: {{shiftTitle}}
{{shiftDescription}}

To view all the details go to Shift Happens: {{portalUrl}}

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      companyName: 'string',
      shiftDate: 'string',
      startTime: 'string',
      endTime: 'string',
      shiftTitle: 'string',
      shiftDescription: 'string',
      portalUrl: 'string',
    },
    allowManualSend: false,
    isActive: true,
  },
  {
    key: 'shift_series_assigned',
    name: 'Shift Series Assigned',
    description:
      'Sent to pharmacists when assigned a series of shifts via update shift series',
    subjectTemplate: 'Multiple Shifts Assigned at {{companyName}}',
    htmlTemplate: `<p>You have been assigned multiple shifts at <strong>{{companyName}}</strong>.</p>
<p>Assigned Shifts Information<br>
{{#each shifts}} 
  <div style="margin-bottom: 15px; padding: 10px; border-left: 4px solid #f44336; background: #fafafa;">
    <p style="margin: 0;">Date: <strong>{{date}}</strong></p>
    <p style="margin: 0;">Time: <strong>{{startTime}} - {{endTime}}</strong></p>
    <p style="margin: 0;">Notes: {{title}}</p> <p style="margin: 0;">{{description}}</p>
    <p style="margin: 8px 0 0;"> 
      <a href="{{gcalLink}}">Add shift to Google Calendar</a> 
    </p> 
  </div> 
{{/each}}
<p>We'll reach out <strong>24 hours before your shift</strong> with your pharmacy access codes and login details.<br>
Once you get to the store, you'll find a <strong>location-specific Pharmacist Relief Binder</strong> with<br>
guidance on workflows, procedures, and key contacts to help your shift run smoothly.</p>
<p>If you have any questions or concerns, please reach out to the Pharmacy manager. You will find<br>
the contact information located in the accepted shift on the portal.<br>
<a href="{{portalUrl}}">Click here to log in</a></p>
<p>Thank you for supporting our pharmacy network.</p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `You have been assigned multiple shifts at {{companyName}}.

Assigned Shifts Information
{{#each shifts}} 
Date: {{date}} 
Time: {{startTime}} - {{endTime}} 
Notes: {{title}} 
{{description}} 
Add shift to Google Calendar: {{gcalLink}} 

{{/each}}

We'll reach out 24 hours before your shift with your pharmacy access codes and login details.
Once you get to the store, you'll find a location-specific Pharmacist Relief Binder with
guidance on workflows, procedures, and key contacts to help your shift run smoothly.

If you have any questions or concerns, please reach out to the Pharmacy manager. You will find
the contact information located in the accepted shift on the portal.
Click here to log in: {{portalUrl}}

Thank you for supporting our pharmacy network.

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      companyName: 'string',
      shifts: 'array',
      portalUrl: 'string',
    },
    allowManualSend: false,
    isActive: true,
  },
  {
    key: 'taken_shift_series_updated',
    name: 'Taken Shift Series Updated',
    description:
      'Sent to pharmacists when assigned shifts in a series are updated',
    subjectTemplate: 'Multiple Shifts Updated at {{companyName}}',
    htmlTemplate: `<p>Your assigned shifts at  <strong>{{companyName}}</strong> have been updated.</p>
<p>Updated Shifts Information<br>
{{#each shifts}} 
  <div style="margin-bottom: 15px; padding: 10px; border-left: 4px solid #f44336; background: #fafafa;">
    <p style="margin: 0;">Date: <strong>{{date}}</strong></p>
    <p style="margin: 0;">Time: <strong>{{startTime}} - {{endTime}}</strong></p>
    <p style="margin: 0;">Notes: {{title}}</p> <p style="margin: 0;">{{description}}</p>
    <p style="margin: 8px 0 0;"> 
      <a href="{{gcalLink}}">Add shift to Google Calendar</a> 
    </p> 
  </div> 
{{/each}}
<p>To view your updated schedule, visit 
<a href="{{portalUrl}}">Shift Happens.</a></p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `Your assigned shifts at {{companyName}} have been updated.

Updated Shifts Information
{{#each shifts}} 
Date: {{date}} 
Time: {{startTime}} - {{endTime}} 
Notes: {{title}} 
{{description}} 
Add shift to Google Calendar: {{gcalLink}} 

{{/each}}

To view your updated schedule, visit Shift Happens: {{portalUrl}}

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      companyName: 'string',
      shifts: 'array',
      portalUrl: 'string',
    },
    allowManualSend: false,
    isActive: true,
  },
  {
    key: 'taken_shift_series_cancelled',
    name: 'Taken Shift Series Cancelled',
    description:
      'Sent to pharmacists when multiple assigned shifts in a series are cancelled',
    subjectTemplate: 'Multiple Shifts Cancelled at {{companyName}}',
    htmlTemplate: `<p>The following shifts at <strong>{{companyName}}</strong> have been cancelled.</p>
{{#each shifts}} 
  <div style="margin-bottom: 15px; padding: 10px; border-left: 4px solid #f44336; background: #fafafa;">
    <p style="margin: 0;">Date: <strong>{{date}}</strong></p>
    <p style="margin: 0;">Time: <strong>{{startTime}} - {{endTime}}</strong></p>
    <p style="margin: 0;">Notes: {{title}}</p> <p style="margin: 0;">{{description}}</p>
    <p style="margin: 8px 0 0;"> 
      <a href="{{gcalLink}}">Add shift to Google Calendar</a> 
    </p> 
  </div> 
{{/each}}
<p>To view your updated schedule, visit 
<a href="{{portalUrl}}">Shift Happens.</a></p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `The following shifts at {{companyName}} have been cancelled.

{{#each shifts}} 
Date: {{date}} 
Time: {{startTime}} - {{endTime}} 
Notes: {{title}} 
{{description}} 
Add shift to Google Calendar: {{gcalLink}} 

{{/each}}

To view your updated schedule, visit Shift Happens: {{portalUrl}}

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      companyName: 'string',
      shifts: 'array',
      portalUrl: 'string',
    },
    allowManualSend: false,
    isActive: true,
  },
  {
    key: 'cancel_request_rejected',
    name: 'Cancel Request Rejected',
    description:
      'Sent to pharmacist when their shift cancellation request is rejected',
    subjectTemplate: 'Shift Cancel Request Rejected at {{companyName}}',
    htmlTemplate: `<p>Your shift cancellation request at <strong>{{companyName}}</strong> has been rejected.</p>
<p>Please be aware that you are still assigned for this shift.</p>
<p>Shift Information<br>
Date: <strong>{{shiftDate}}</strong><br>
From: <strong>{{startTime}}</strong><br>
To: <strong>{{endTime}}</strong><br>
Notes: {{shiftTitle}}<br>
{{shiftDescription}}</p>
<p>To view all the details go to
<a href="{{portalUrl}}">Shift Happens.</a></p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `Your shift cancellation request at {{companyName}} has been rejected.

Please be aware that you are still assigned for this shift.

Shift Information
Date: {{shiftDate}}
From: {{startTime}}
To: {{endTime}}
Notes: {{shiftTitle}}
{{shiftDescription}}

To view all the details go to Shift Happens: {{portalUrl}}

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      companyName: 'string',
      shiftDate: 'string',
      startTime: 'string',
      endTime: 'string',
      shiftTitle: 'string',
      shiftDescription: 'string',
      portalUrl: 'string',
    },
    allowManualSend: false,
    isActive: true,
  },
  {
    key: 'cancel_request_approved',
    name: 'Cancel Request Approved',
    description:
      'Sent to pharmacist when their shift cancellation request is approved',
    subjectTemplate: 'Shift Cancel Request Approved at {{companyName}}',
    htmlTemplate: `<p>Your shift cancellation request at <strong>{{companyName}}</strong> has been approved.</p>
<p>Please be aware that you are no longer assigned for this shift.</p>
<p>Shift Information<br>
Date: <strong>{{shiftDate}}</strong><br>
From: <strong>{{startTime}}</strong><br>
To: <strong>{{endTime}}</strong><br>
Notes: {{shiftTitle}}<br>
{{shiftDescription}}</p>
<p>To view all the details go to
<a href="{{portalUrl}}">Shift Happens.</a></p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `Your shift cancellation request at {{companyName}} has been approved.

Please be aware that you are no longer assigned for this shift.

Shift Information
Date: {{shiftDate}}
From: {{startTime}}
To: {{endTime}}
Notes: {{shiftTitle}}
{{shiftDescription}}

To view all the details go to Shift Happens: {{portalUrl}}

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      companyName: 'string',
      shiftDate: 'string',
      startTime: 'string',
      endTime: 'string',
      shiftTitle: 'string',
      shiftDescription: 'string',
      portalUrl: 'string',
    },
    allowManualSend: false,
    isActive: true,
  },
  {
    key: 'new_account_created',
    name: 'New Account Created',
    description: 'Sent to new users when their account is created',
    subjectTemplate:
      'Your Account has been Created for Curis Pharmacy Relief Portal!',
    htmlTemplate: `<p>Hi {{firstName}},</p>
<p>Welcome to Shift Happens! Your account has been successfully created. This portal will be <br>
used to find open shifts, see accepted shifts, and have direct contact with any of the CurisRx & Pharm Drugstore<br>
store managers!</p>
<p>Click the button below to set your password and access your account:</p>
<p style="text-align: left; margin: 30px 0;">
<a href="{{resetLink}}" style="background-color: #ed2375; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
Set Your Password
</a>
</p>
<p>Or copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #666; font-size: 14px;">{{resetLink}}</p>
<p>This link will expire in 1 hour.</p>
<p><strong>If this is your first time logging in, we recommend taking a minute to:</strong></p>
<ul>
<li>Complete your profile</li>
<li>Explore the dashboard</li>
<li>Check out the calendar to accept your first shift</li>
</ul>
<p>If you have any questions, our team is here to help.</p>
<p>Welcome aboard, we're excited to have you!<br>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `Hi {{firstName}},

Welcome to Shift Happens! Your account has been successfully created. This portal will be 
used to find open shifts, see accepted shifts, and have direct contact with any of the CurisRx & Pharm Drugstore
store managers!

Click the link below to set your password and access your account:
{{resetLink}}

Or copy and paste this link into your browser:
{{resetLink}}

This link will expire in 1 hour.

If this is your first time logging in, we recommend taking a minute to:
- Complete your profile
- Explore the dashboard
- Check out the calendar to accept your first shift

If you have any questions, our team is here to help.

Welcome aboard, we're excited to have you!

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      firstName: 'string',
      resetLink: 'string',
    },
    allowManualSend: false,
    isActive: true,
  },
  {
    key: 'new_pharmacist_request',
    name: 'New Pharmacist Request',
    description: 'Sent to admins when a new pharmacist request is submitted',
    subjectTemplate: 'New request to add a pharmacist',
    htmlTemplate: `<p>A new request to add a pharmacist has been received.</p>
<h3>Request Information</h3>
<p>Pharmacist Name: <strong>{{pharmacistFirstName}} {{pharmacistLastName}}</strong><br>
Email: <strong>{{pharmacistEmail}}</strong><br>
Submitted By: <strong>{{submittedByName}}</strong><br></p>
<p>To review this request, please log in to
<a href="{{portalUrl}}">Shift Happens.</a> and
process the request.</p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `A new request to add a pharmacist has been received.

Request Information
Pharmacist Name: {{pharmacistFirstName}} {{pharmacistLastName}}
Email: {{pharmacistEmail}}
Submitted By: {{submittedByName}}

To review this request, please log in to Shift Happens: {{portalUrl}} and process the request.

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      pharmacistFirstName: 'string',
      pharmacistLastName: 'string',
      pharmacistEmail: 'string',
      submittedByName: 'string',
      portalUrl: 'string',
    },
    allowManualSend: false,
    isActive: true,
  },
  {
    key: 'pharmacist_request_approved',
    name: 'Pharmacist Request Approved',
    description: 'Sent to requester when a pharmacist request is approved',
    subjectTemplate: 'Your request to add a pharmacist has been approved',
    htmlTemplate: `<p>Your request to add a pharmacist has been approved.</p>
<p>The pharmacist has been added to the system.</p>
<h3>Pharmacist Information</h3>
<p>Pharmacist Name: <strong>{{pharmacistFirstName}} {{pharmacistLastName}}</strong><br>
Email: <strong>{{pharmacistEmail}}</strong><br></p>
<p>To view all the details go to
<a href="{{portalUrl}}">Shift Happens.</a></p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `Your request to add a pharmacist has been approved.

The pharmacist has been added to the system.

Pharmacist Information
Pharmacist Name: {{pharmacistFirstName}} {{pharmacistLastName}}
Email: {{pharmacistEmail}}

To view all the details go to Shift Happens: {{portalUrl}}

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      pharmacistFirstName: 'string',
      pharmacistLastName: 'string',
      pharmacistEmail: 'string',
      portalUrl: 'string',
    },
    allowManualSend: false,
    isActive: true,
  },
  {
    key: 'pharmacist_request_rejected',
    name: 'Pharmacist Request Rejected',
    description: 'Sent to requester when a pharmacist request is rejected',
    subjectTemplate: 'Your request to add a pharmacist has been rejected',
    htmlTemplate: `<p>Your request to add a pharmacist has been rejected.</p>
<p>The pharmacist was not added to the system.</p>
<h3>Pharmacist Information</h3>
<p>Pharmacist Name: <strong>{{pharmacistFirstName}} {{pharmacistLastName}}</strong><br>
Email: <strong>{{pharmacistEmail}}</strong><br></p>
<p>To view all the details go to
<a href="{{portalUrl}}">Shift Happens.</a></p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `Your request to add a pharmacist has been rejected.

The pharmacist was not added to the system.

Pharmacist Information
Pharmacist Name: {{pharmacistFirstName}} {{pharmacistLastName}}
Email: {{pharmacistEmail}}

To view all the details go to Shift Happens: {{portalUrl}}

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      pharmacistFirstName: 'string',
      pharmacistLastName: 'string',
      pharmacistEmail: 'string',
      portalUrl: 'string',
    },
    allowManualSend: false,
    isActive: true,
  },
  {
    key: 'password_reset',
    name: 'Password Reset',
    description: 'Sent to users when they request a password reset',
    subjectTemplate: 'Reset Your Password - Shift Happens',
    htmlTemplate: `<p>Hi there,</p>
<p>You requested to reset your password for your Shift Happens account.</p>
<p>Click the button below to set a new password:</p>
<p style="text-align: left; margin: 30px 0;">
<a href="{{resetLink}}" style="background-color: #ed2375; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
Reset Password
</a>
</p>
<p>Or copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #666; font-size: 14px;">{{resetLink}}</p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>Cheers,<br>
CurisRx Pharmacy<br>
Pharm Drugstore</p>`,
    textTemplate: `Hi there,

You requested to reset your password for your Shift Happens account.

Click the link below to set a new password:
{{resetLink}}

Or copy and paste this link into your browser:
{{resetLink}}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

Cheers,
CurisRx Pharmacy
Pharm Drugstore`,
    variables: {
      resetLink: 'string',
    },
    allowManualSend: false,
    isActive: true,
  },
];

async function main() {
  console.log('🌱 Starting email template seed...');

  for (const template of templates) {
    const existing = await prisma.emailTemplate.findUnique({
      where: { key: template.key },
    });

    if (existing) {
      console.log(`⏭️  Template "${template.key}" already exists, updating...`);
      await prisma.emailTemplate.update({
        where: { key: template.key },
        data: {
          name: template.name,
          description: template.description,
          subjectTemplate: template.subjectTemplate,
          htmlTemplate: template.htmlTemplate,
          textTemplate: template.textTemplate,
          variables: template.variables,
          allowManualSend: template.allowManualSend,
          isActive: template.isActive,
          updatedById: null,
        },
      });

      await prisma.emailTemplateVersion.create({
        data: {
          templateId: existing.id,
          version: 2,
          subjectTemplate: template.subjectTemplate,
          htmlTemplate: template.htmlTemplate,
          textTemplate: template.textTemplate,
          changedById: null,
        },
      });
    } else {
      console.log(`✅ Creating template "${template.key}"...`);
      const created = await prisma.emailTemplate.create({
        data: {
          key: template.key,
          name: template.name,
          description: template.description,
          subjectTemplate: template.subjectTemplate,
          htmlTemplate: template.htmlTemplate,
          textTemplate: template.textTemplate,
          variables: template.variables,
          allowManualSend: template.allowManualSend,
          isActive: template.isActive,
          createdById: null,
          updatedById: null,
        },
      });

      await prisma.emailTemplateVersion.create({
        data: {
          templateId: created.id,
          version: 1,
          subjectTemplate: template.subjectTemplate,
          htmlTemplate: template.htmlTemplate,
          textTemplate: template.textTemplate,
          changedById: null,
        },
      });
    }
  }

  console.log('✨ Email template seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
