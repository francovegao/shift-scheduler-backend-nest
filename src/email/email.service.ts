import { Injectable, Logger } from '@nestjs/common';
import { Shift } from '../../generated/prisma/client';
import { Resend } from 'resend';
import { formatInTimeZone } from 'date-fns-tz';
import { PrismaService } from 'src/prisma/prisma.service';

type ShiftWithCompany = Shift & { company: { name: string; timezone: string } };
type ShiftWithCompanyAddress = Shift & {
  company: {
    name: string;
    timezone: string;
    address: string | null;
    city: string | null;
    province: string | null;
  };
};
type ShiftWithPharmacist = Shift & {
  company: {
    name: string;
    timezone: string;
    contactName: string | null;
    contactEmail: string | null;
  };
  pharmacist: {
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  } | null;
};

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor(private prisma: PrismaService) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async emailPharmacistShiftTaken(to: string, shift: ShiftWithCompanyAddress) {
    const templateName = 'shift_taken';
    const subject = `New Shift Assigned at ${shift.company.name}`;

    const shiftDate = formatDate(shift.startTime, shift.company.timezone);
    const startTime = formatTime(shift.startTime, shift.company.timezone);
    const endTime = formatTime(shift.endTime, shift.company.timezone);

    const htmlContent = `<p>You have taken a shift at <strong>${shift.company.name}</strong></p>
                              <p>Shift Information<br>
                              Date: <strong>${shiftDate}</strong><br>
                              From: <strong>${startTime}</strong><br>
                              To: <strong>${endTime}</strong><br>
                              Notes: ${shift.title}<br>
                              ${shift.description}</p>
                              <a href="${generateGCalLink(shift)}">
                              Click here to add shift
                              to Google Calendar</a>
                              <p>To view all the details go to
                              <a href="https://shifthappens.vercel.app/">Shift Happens.</a></p>
                              <p>Thank you,<br>
                              Shift Happens Team</p>`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Shift Happens <info@shifthappens.curisrx.ca>',
        to: [to],
        subject: subject,
        html: htmlContent,
      });

      if (error) throw new Error(JSON.stringify(error));

      await this.logEmail({
        to,
        subject,
        status: 'sent',
        templateName,
        providerMessageId: data.id,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logEmail({
        to,
        subject,
        status: 'failed',
        templateName,
        errorMessage: getErrorMessage(error),
      });
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  async emailManagersShiftTaken(
    managersEmails: string[],
    shift: ShiftWithCompany,
    pharmacistName: string,
  ) {
    const templateName = 'notify_shift_taken';
    const subject = `New Shift Assigned at ${shift.company.name}`;

    const shiftDate = formatDate(shift.startTime, shift.company.timezone);
    const startTime = formatTime(shift.startTime, shift.company.timezone);
    const endTime = formatTime(shift.endTime, shift.company.timezone);

    const htmlContent = `<p>A pharmacist has taken a shift at <strong>${shift.company.name}</strong><br>
                                Pharmacist name: <strong>${pharmacistName}</strong></p>
                              <p>Shift Information<br>
                              Date: <strong>${shiftDate}</strong><br>
                              From: <strong>${startTime}</strong><br>
                              To: <strong>${endTime}</strong><br>
                              Notes: ${shift.title}<br>
                              ${shift.description}</p>
                              <p>To view all the details go to
                              <a href="https://shifthappens.vercel.app/">Shift Happens.</a></p>
                              <p>Thank you,<br>
                              Shift Happens Team</p>`;

    try {
      const batchEmails = managersEmails.map((email) => ({
        from: 'Shift Happens <info@shifthappens.curisrx.ca>',
        to: [email],
        subject: subject,
        html: htmlContent,
      }));

      const { data, error } = await this.resend.batch.send(batchEmails);

      if (error) throw new Error(JSON.stringify(error));

      await Promise.all(
        managersEmails.map((to, index) =>
          this.logEmail({
            to,
            subject,
            status: 'sent',
            templateName,
            providerMessageId: data?.data[index]?.id,
          }),
        ),
      );

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await Promise.all(
        managersEmails.map((to) =>
          this.logEmail({
            to,
            subject,
            status: 'failed',
            templateName,
            errorMessage: getErrorMessage(error),
          }),
        ),
      );
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  async emailPharmacistShiftOpen(to: string, shift: ShiftWithCompany) {
    const templateName = 'open_shift_manual_notification';
    const subject = `Shift Open at ${shift.company.name}`;

    const shiftDate = formatDate(shift.startTime, shift.company.timezone);
    const startTime = formatTime(shift.startTime, shift.company.timezone);
    const endTime = formatTime(shift.endTime, shift.company.timezone);

    const htmlContent = `<p>There is an open shift at <strong>${shift.company.name}</strong>.</p>
                              <h3>Shift Information</h3>
                              <p>Date: <strong>${shiftDate}</strong><br>
                              From: <strong>${startTime}</strong><br>
                              To: <strong>${endTime}</strong><br>
                              Notes: ${shift.title}<br>
                              ${shift.description}</p>
                              <p>If you would like to take this shift go to
                              <a href="https://shifthappens.vercel.app/">Shift Happens.</a></p>
                              <p>Thank you,<br>
                              Shift Happens Team</p>`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Shift Happens <info@shifthappens.curisrx.ca>',
        to: [to],
        subject: subject,
        html: htmlContent,
      });

      if (error) throw new Error(JSON.stringify(error));

      await this.logEmail({
        to,
        subject,
        status: 'sent',
        templateName,
        providerMessageId: data.id,
      });

      await this.logEmail({
        to,
        subject,
        status: 'sent',
        templateName,
        providerMessageId: data.id,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logEmail({
        to,
        subject,
        status: 'failed',
        templateName,
        errorMessage: getErrorMessage(error),
      });

      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  //Send this email when an assigned shift start or end times are updated
  async emailPharmacistShiftUpdated(
    to: string,
    shift: ShiftWithCompanyAddress,
  ) {
    const templateName = 'taken_shift_updated';
    const subject = `Shift Updated at ${shift.company.name}`;

    const shiftDate = formatDate(shift.startTime, shift.company.timezone);
    const startTime = formatTime(shift.startTime, shift.company.timezone);
    const endTime = formatTime(shift.endTime, shift.company.timezone);

    const htmlContent = `<p>Your assigned shift at <strong>${shift.company.name}</strong> was updated.</p>
                              <p>Updated Shift Information<br>
                              Date: <strong>${shiftDate}</strong><br>
                              From: <strong>${startTime}</strong><br>
                              To: <strong>${endTime}</strong><br>
                              Notes: ${shift.title}<br>
                              ${shift.description}</p>
                              <a href="${generateGCalLink(shift)}">
                              Click here to add shift
                              to Google Calendar</a>
                              <p>To view all the details go to
                              <a href="https://shifthappens.vercel.app/">Shift Happens.</a></p>
                              <p>Thank you,<br>
                              Shift Happens Team</p>`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Shift Happens <info@shifthappens.curisrx.ca>',
        to: [to],
        subject: subject,
        html: htmlContent,
      });

      if (error) throw new Error(JSON.stringify(error));

      await this.logEmail({
        to,
        subject,
        status: 'sent',
        templateName,
        providerMessageId: data.id,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logEmail({
        to,
        subject,
        status: 'failed',
        templateName,
        errorMessage: getErrorMessage(error),
      });
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  async emailRequestShiftCancellation(
    adminAndContactPersonEmails: string[],
    shift: ShiftWithPharmacist,
    cancellationReason: string,
  ) {
    const templateName = 'request_shift_cancellation';
    const subject = `Request to cancel shift at ${shift.company.name}`;

    const shiftDate = formatDate(shift.startTime, shift.company.timezone);
    const startTime = formatTime(shift.startTime, shift.company.timezone);
    const endTime = formatTime(shift.endTime, shift.company.timezone);

    const htmlContent = `<p>A pharmacist wants to cancel a shift at at <strong>${shift.company.name}</strong>.</p>
                              <h3>Shift Information</h3>
                              <p>Date: <strong>${shiftDate}</strong><br>
                              From: <strong>${startTime}</strong><br>
                              To: <strong>${endTime}</strong><br>
                              Notes: ${shift.title}<br>
                              ${shift.description}</p>
                              <h3>Pharmacist Information</h3>
                              <p>Name: <strong>${shift?.pharmacist?.user.firstName} ${shift?.pharmacist?.user.lastName}</strong><br>
                              email: <strong>${shift?.pharmacist?.user.email}</strong></p>
                              <h3>Cancel Reason</h3>
                              <p>Reason: <strong>${cancellationReason}</strong><br>
                              <p>To approve this request, please log in to
                              <a href="https://shifthappens.vercel.app/">Shift Happens.</a> and
                              cancel this shift.</p>
                              <p>Thank you,<br>
                              Shift Happens Team</p>`;

    try {
      const batchEmails = adminAndContactPersonEmails.map((email) => ({
        from: 'Shift Happens <info@shifthappens.curisrx.ca>',
        to: [email],
        subject: subject,
        html: htmlContent,
      }));

      const { data, error } = await this.resend.batch.send(batchEmails);

      if (error) throw new Error(JSON.stringify(error));

      await Promise.all(
        adminAndContactPersonEmails.map((to, index) =>
          this.logEmail({
            to,
            subject,
            status: 'sent',
            templateName,
            providerMessageId: data?.data[index]?.id,
          }),
        ),
      );

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await Promise.all(
        adminAndContactPersonEmails.map((to) =>
          this.logEmail({
            to,
            subject,
            status: 'failed',
            templateName,
            errorMessage: getErrorMessage(error),
          }),
        ),
      );
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  //Send this email when an assigned shift changes pharmacistId or is deleted
  async emailPharmacistShiftCancelled(to: string, shift: ShiftWithCompany) {
    const templateName = 'taken_shift_cancelled';
    const subject = `Shift Cancelled at ${shift.company.name}`;

    const shiftDate = formatDate(shift.startTime, shift.company.timezone);
    const startTime = formatTime(shift.startTime, shift.company.timezone);
    const endTime = formatTime(shift.endTime, shift.company.timezone);

    const htmlContent = `<p>You no longer have a shift at <strong>${shift.company.name}</strong></p>
                              <p>Cancelled Shift Information<br>
                              Date: <strong>${shiftDate}</strong><br>
                              From: <strong>${startTime}</strong><br>
                              To: <strong>${endTime}</strong><br>
                              Notes: ${shift.title}<br>
                              ${shift.description}</p>
                              <p>To view all the details go to
                              <a href="https://shifthappens.vercel.app/">Shift Happens.</a></p>
                              <p>Thank you,<br>
                              Shift Happens Team</p>`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Shift Happens <info@shifthappens.curisrx.ca>',
        to: [to],
        subject: subject,
        html: htmlContent,
      });

      if (error) throw new Error(JSON.stringify(error));

      await this.logEmail({
        to,
        subject,
        status: 'sent',
        templateName,
        providerMessageId: data.id,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logEmail({
        to,
        subject,
        status: 'failed',
        templateName,
        errorMessage: getErrorMessage(error),
      });
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  //Send this email when assigned shifts that belong to a series are updated
  async emailPharmacistsShiftSeriesUpdated(
    pharmacistsEmails: string[],
    shifts: ShiftWithPharmacist[],
  ) {
    const templateName = 'taken_shift_series_updated';
    const companyName = shifts[0]?.company?.name || 'pharmacy';
    const subject = `Multipe Shifts Updated at ${companyName}`;

    const shiftsByEmail = shifts.reduce(
      (acc, shift) => {
        const email = shift.pharmacist?.user.email;
        if (email) {
          if (!acc[email]) acc[email] = [];
          acc[email].push(shift);
        }
        return acc;
      },
      {} as Record<string, ShiftWithPharmacist[]>,
    );

    const generateHtmlContent = (email: string): string => {
      const userShifts = shiftsByEmail[email] || [];

      const shiftListHtml = userShifts
        .map((shift) => {
          const shiftDate = formatDate(shift.startTime, shift.company.timezone);
          const startTime = formatTime(shift.startTime, shift.company.timezone);
          const endTime = formatTime(shift.endTime, shift.company.timezone);

          return `
        <div style="margin-bottom: 15px; padding: 10px; border-left: 4px solid #f44336; background: #fafafa;">
          <p style="margin: 0;">Date: <strong>${shiftDate}</strong></p>
          <p style="margin: 0;">Time: <strong>${startTime} - ${endTime}</strong></p>
          <p style="margin: 0;">Notes: ${shift.title || 'N/A'}</p>
          <p style="margin: 0;">${shift.description}</p>
        </div>
      `;
        })
        .join('');

      return `<p>Your assigned shifts at  <strong>${companyName}</strong> have been updated.</p>
              <p>Updated Shifts Information<br>
              ${shiftListHtml}
              <p>To view your updated schedule, visit 
              <a href="https://shifthappens.vercel.app/">Shift Happens.</a></p>
              <p>Thank you,<br>
              Shift Happens Team</p>`;
    };

    try {
      const emailsToProcess = Object.keys(shiftsByEmail);
      const batchEmails = emailsToProcess.map((email) => ({
        from: 'Shift Happens <info@shifthappens.curisrx.ca>',
        to: [email],
        subject: subject,
        html: generateHtmlContent(email),
      }));

      if (batchEmails.length === 0) return;

      const { data, error } = await this.resend.batch.send(batchEmails);

      if (error) throw new Error(JSON.stringify(error));

      await Promise.all(
        emailsToProcess.map((to, index) =>
          this.logEmail({
            to,
            subject,
            status: 'sent',
            templateName,
            providerMessageId: data?.data?.[index]?.id,
          }),
        ),
      );

      this.logger.log('Emails sent successfully');
      return data;
    } catch (error) {
      await Promise.all(
        pharmacistsEmails.map((to) =>
          this.logEmail({
            to,
            subject,
            status: 'failed',
            templateName,
            errorMessage: getErrorMessage(error),
          }),
        ),
      );
      this.logger.error(
        'Unexpected error sending emails',
        (error as Error).stack,
      );
      throw error;
    }
  }

  //Send this email when multiple assigned shifts that belongs to a series change pharmacistId or are deleted
  async emailPharmacistsShiftSeriesCancelled(
    pharmacistsEmails: string[],
    shifts: ShiftWithPharmacist[],
  ) {
    const templateName = 'taken_shift_series_cancelled';
    const companyName = shifts[0]?.company?.name || 'pharmacy';
    const subject = `Multipe Shifts Cancelled at ${companyName}`;

    const shiftsByEmail = shifts.reduce(
      (acc, shift) => {
        const email = shift.pharmacist?.user.email;
        if (email) {
          if (!acc[email]) acc[email] = [];
          acc[email].push(shift);
        }
        return acc;
      },
      {} as Record<string, ShiftWithPharmacist[]>,
    );

    const generateHtmlContent = (email: string): string => {
      const userShifts = shiftsByEmail[email] || [];

      const shiftListHtml = userShifts
        .map((shift) => {
          const shiftDate = formatDate(shift.startTime, shift.company.timezone);
          const startTime = formatTime(shift.startTime, shift.company.timezone);
          const endTime = formatTime(shift.endTime, shift.company.timezone);

          return `
        <div style="margin-bottom: 15px; padding: 10px; border-left: 4px solid #f44336; background: #fafafa;">
          <p style="margin: 0;">Date: <strong>${shiftDate}</strong></p>
          <p style="margin: 0;">Time: <strong>${startTime} - ${endTime}</strong></p>
          <p style="margin: 0;">Notes: ${shift.title || 'N/A'}</p>
        </div>
      `;
        })
        .join('');

      return `<p>The following shifts at <strong>${companyName}</strong> have been cancelled.</p>
              ${shiftListHtml}
              <p>To view your updated schedule, visit 
              <a href="https://shifthappens.vercel.app/">Shift Happens.</a></p>
              <p>Thank you,<br>
              Shift Happens Team</p>`;
    };

    try {
      const emailsToProcess = Object.keys(shiftsByEmail);
      const batchEmails = emailsToProcess.map((email) => ({
        from: 'Shift Happens <info@shifthappens.curisrx.ca>',
        to: [email],
        subject: subject,
        html: generateHtmlContent(email),
      }));

      if (batchEmails.length === 0) return;

      const { data, error } = await this.resend.batch.send(batchEmails);

      if (error) throw new Error(JSON.stringify(error));

      await Promise.all(
        emailsToProcess.map((to, index) =>
          this.logEmail({
            to,
            subject,
            status: 'sent',
            templateName,
            providerMessageId: data?.data?.[index]?.id,
          }),
        ),
      );

      this.logger.log('Emails sent successfully');
      return data;
    } catch (error) {
      await Promise.all(
        pharmacistsEmails.map((to) =>
          this.logEmail({
            to,
            subject,
            status: 'failed',
            templateName,
            errorMessage: getErrorMessage(error),
          }),
        ),
      );
      this.logger.error(
        'Unexpected error sending emails',
        (error as Error).stack,
      );
      throw error;
    }
  }

  async emailNewUser(to: string, email: string, password: string) {
    const templateName = 'new_account_created';
    const subject = `Account created at Shift Happens App`;

    const htmlContent = `<p>Your account has been created.</p>
                              <p>Log in Information<br>
                              email: <strong>${email}</strong><br>
                              Temporary Password: <strong>${password}</strong></p>
                              <p>Please log in and <strong>update your password</strong> in the profile page.<br>
                              <a href="https://shifthappens.vercel.app">Click here to log in.</a></p>
                              <p>Thank you,<br>
                              Shift Happens Team</p>`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Shift Happens <info@shifthappens.curisrx.ca>',
        to: [to],
        subject: subject,
        html: htmlContent,
      });

      if (error) throw new Error(JSON.stringify(error));

      await this.logEmail({
        to,
        subject,
        status: 'sent',
        templateName,
        providerMessageId: data.id,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logEmail({
        to,
        subject,
        status: 'failed',
        templateName,
        errorMessage: getErrorMessage(error),
      });
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  private async logEmail(params: {
    to: string;
    subject: string;
    status: 'sent' | 'failed';
    templateName?: string;
    providerMessageId?: string;
    errorMessage?: string;
  }) {
    return await this.prisma.emailLog.create({
      data: {
        recipientEmail: params.to,
        subject: params.subject,
        status: params.status,
        templateName: params.templateName,
        providerMessageId: params.providerMessageId,
        errorMessage: params.errorMessage,
      },
    });
  }
}

function formatDate(stringDate, timeZone) {
  return formatInTimeZone(stringDate, timeZone, 'EEEE, MMMM d');
}

function formatTime(stringDate, timeZone) {
  return formatInTimeZone(stringDate, timeZone, 'HH:mm');
}

function generateGCalLink(shift: ShiftWithCompanyAddress) {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';

  const start = formatInTimeZone(
    shift.startTime,
    shift.company?.timezone,
    "yyyyMMdd'T'HHmmssXXX",
  );
  const end = formatInTimeZone(
    shift.endTime,
    shift.company?.timezone,
    "yyyyMMdd'T'HHmmssXXX",
  );
  const appLink = `https://shifthappens.vercel.app/`;
  const eventDetails = `Details: ${shift.title || ''}: ${shift.description || ''} \n\n<a href="${appLink}">Click here to view all details</a>`;

  const params = new URLSearchParams({
    text: `Shift at ${shift.company?.name}`,
    dates: `${start}/${end}`,
    details: eventDetails,
    location:
      getFullAddress(
        shift.company?.address,
        shift.company?.city,
        shift.company?.province,
        null,
      ) || '',
  });

  return `${baseUrl}&${params.toString()}`;
}

function getFullAddress(
  address: string | null | undefined,
  city: string | null | undefined,
  province: string | null | undefined,
  postalCode: string | null | undefined,
) {
  if (!address && !city && !province && !postalCode) {
    return 'No address info';
  }

  const parts = [address, city, province, postalCode].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'No address info';
}
function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}
