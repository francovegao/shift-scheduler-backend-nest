/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { PharmacistRequest, Shift } from '../../generated/prisma/client';
import {
  Resend,
  CreateBatchSuccessResponse,
  CreateBatchRequestOptions,
} from 'resend';
import { formatInTimeZone } from 'date-fns-tz';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailTemplateRendererService } from './email-template-renderer.service';

type ShiftWithCompany = Shift & { company: { name: string; timezone: string } };
type ShiftWithCompanyAddress = Shift & {
  company: {
    name: string;
    timezone: string;
    address: string | null;
    city: string | null;
    province: string | null;
  };
  pharmacist: {
    user: {
      email: string;
      firstName: string | null;
    };
  } | null;
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

  constructor(
    private prisma: PrismaService,
    private emailTemplateRenderer: EmailTemplateRendererService,
  ) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  private readonly portalUrl =
    process.env.FRONTEND_URL || 'https://shifthappens.vercel.app';

  private async sendTemplateEmail(
    templateKey: string,
    to: string,
    data: Record<string, any>,
  ): Promise<{
    data: { id: string; subject: string; templateVersion: number } | null;
    error: Error | null;
  }> {
    const rendered = await this.emailTemplateRenderer.render(templateKey, data);

    const result = await this.resend.emails.send({
      from: 'Shift Happens <info@shifthappens.curisrx.ca>',
      to: [to],
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    return {
      data: result.data
        ? {
            id: result.data.id,
            subject: rendered.subject,
            templateVersion: rendered.templateVersion,
          }
        : null,
      error: result.error,
    };
  }

  private async sendTemplateBatchEmail(
    templateKey: string,
    emails: string[],
    data: Record<string, any>,
  ): Promise<{
    data: CreateBatchSuccessResponse<CreateBatchRequestOptions> | null;
    error: Error | null;
    subject: string;
    templateVersion: number;
  }> {
    const rendered = await this.emailTemplateRenderer.render(templateKey, data);

    const batchEmails = emails.map((email) => ({
      from: 'Shift Happens <info@shifthappens.curisrx.ca>',
      to: [email],
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    }));

    const result = await this.resend.batch.send(batchEmails);
    return {
      data: result.data,
      error: result.error,
      subject: rendered.subject,
      templateVersion: rendered.templateVersion,
    };
  }

  private async logSingleEmailResult(params: {
    to: string;
    templateName: string;
    subject: string;
    status: 'sent' | 'failed';
    providerMessageId?: string;
    templateVersion?: number;
    error?: unknown;
  }) {
    try {
      await this.logEmail({
        to: params.to,
        templateName: params.templateName,
        subject: params.subject,
        status: params.status,
        providerMessageId: params.providerMessageId,
        templateVersion: params.templateVersion,
        errorMessage: params.error ? getErrorMessage(params.error) : undefined,
      });
    } catch (dbError) {
      this.logger.error(
        'Failed to log single email to database',
        (dbError as Error).stack,
      );
    }
  }

  private async logBatchEmailResult(params: {
    emails: string[];
    templateName: string;
    subject: string;
    status: 'sent' | 'failed';
    providerMessageIds?: string[];
    templateVersion?: number;
    error?: unknown;
  }) {
    try {
      await Promise.all(
        params.emails.map((to, index) =>
          this.logEmail({
            to,
            templateName: params.templateName,
            subject: params.subject,
            status: params.status,
            providerMessageId: params.providerMessageIds?.[index],
            templateVersion: params.templateVersion,
            errorMessage: params.error
              ? getErrorMessage(params.error)
              : undefined,
          }),
        ),
      );
    } catch (dbError) {
      this.logger.error(
        'Failed to log batch emails to database',
        (dbError as Error).stack,
      );
    }
  }

  //Send this email to a pharmacist when admin or manager creates or updates a single shift and it is freshly assigned to a pharmacist
  async emailPharmacistShiftAssigned(
    to: string,
    shift: ShiftWithCompanyAddress,
  ) {
    if (!to) return;

    const templateName = 'shift_assigned';

    const emailData = {
      pharmacistFirstName: shift?.pharmacist?.user?.firstName,
      companyName: shift.company.name,
      shiftDate: formatDate(shift.startTime, shift.company.timezone),
      startTime: formatTime(shift.startTime, shift.company.timezone),
      endTime: formatTime(shift.endTime, shift.company.timezone),
      shiftTitle: shift.title || 'N/A',
      shiftDescription: shift.description || '',
      gcalLink: generateGCalLink(shift, this.portalUrl),
      portalUrl: this.portalUrl,
    };

    try {
      const { data, error } = await this.sendTemplateEmail(
        'shift_assigned',
        to,
        emailData,
      );

      if (error) throw new Error(JSON.stringify(error));

      await this.logSingleEmailResult({
        to,
        templateName,
        subject: data?.subject || 'Shift Assigned',
        status: 'sent',
        providerMessageId: data!.id,
        templateVersion: data?.templateVersion,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logSingleEmailResult({
        to,
        templateName,
        subject: 'Shift Assigned',
        status: 'failed',
        error,
      });
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  //Send this email to a pharmacist that has manually taken a shift
  async emailPharmacistShiftTaken(to: string, shift: ShiftWithCompanyAddress) {
    const templateName = 'shift_taken';

    const emailData = {
      pharmacistFirstName: shift?.pharmacist?.user?.firstName,
      companyName: shift.company.name,
      shiftDate: formatDate(shift.startTime, shift.company.timezone),
      startTime: formatTime(shift.startTime, shift.company.timezone),
      endTime: formatTime(shift.endTime, shift.company.timezone),
      shiftTitle: shift.title || 'N/A',
      shiftDescription: shift.description || '',
      gcalLink: generateGCalLink(shift, this.portalUrl),
      portalUrl: this.portalUrl,
    };

    try {
      const { data, error } = await this.sendTemplateEmail(
        templateName,
        to,
        emailData,
      );

      if (error) throw new Error(JSON.stringify(error));

      await this.logSingleEmailResult({
        to,
        templateName,
        subject: data?.subject || 'Shift Taken',
        status: 'sent',
        providerMessageId: data!.id,
        templateVersion: data?.templateVersion,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logSingleEmailResult({
        to,
        templateName,
        subject: 'Shift Taken',
        status: 'failed',
        error,
      });
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  //Send this email to notify managers and admins that a shift was taken manually by a pharmacist
  async emailManagersShiftTaken(
    managersEmails: string[],
    shift: ShiftWithCompany,
    pharmacistName: string,
  ) {
    const templateName = 'notify_shift_taken';

    const emailData = {
      companyName: shift.company.name,
      pharmacistName: pharmacistName,
      shiftDate: formatDate(shift.startTime, shift.company.timezone),
      startTime: formatTime(shift.startTime, shift.company.timezone),
      endTime: formatTime(shift.endTime, shift.company.timezone),
      shiftTitle: shift.title || 'N/A',
      shiftDescription: shift.description || '',
      portalUrl: this.portalUrl,
    };

    try {
      const { data, error } = await this.sendTemplateBatchEmail(
        'notify_shift_taken',
        managersEmails,
        emailData,
      );

      if (error) throw new Error(JSON.stringify(error));

      const providerMessageIds = data?.data?.map((d) => d.id) || [];

      await this.logBatchEmailResult({
        emails: managersEmails,
        templateName,
        subject: data?.subject || 'New Shift Assigned',
        status: 'sent',
        providerMessageIds,
        templateVersion: data?.templateVersion,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logBatchEmailResult({
        emails: managersEmails,
        templateName,
        subject: 'New Shift Assigned',
        status: 'failed',
        error,
      });
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  //Send this email to a pharmacist when admin or manager assigns multiple shifts via create shift series or create bulk shifts
  async emailPharmacistMultipleShiftsAssigned(
    to: string,
    shift: ShiftWithCompanyAddress,
    shiftsDates: string[],
  ) {
    const templateName = 'multiple_shifts_assigned';

    const startTime = formatTime(shift.startTime, shift.company.timezone);
    const endTime = formatTime(shift.endTime, shift.company.timezone);

    const shifts = shiftsDates.map((dateStr) => {
      const shiftDate = new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: shift.company.timezone,
      });
      return {
        shiftDate,
        startTime,
        endTime,
        title: shift.title || 'N/A',
        description: shift.description || '',
        gcalLink: generateGCalLinkForMultipleDates(
          shift,
          dateStr,
          this.portalUrl,
        ),
      };
    });

    const emailData = {
      pharmacistFirstName: shift?.pharmacist?.user?.firstName,
      companyName: shift.company.name,
      shifts,
      portalUrl: this.portalUrl,
    };

    try {
      const { data, error } = await this.sendTemplateEmail(
        templateName,
        to,
        emailData,
      );

      if (error) throw new Error(JSON.stringify(error));

      await this.logSingleEmailResult({
        to,
        templateName,
        subject: data?.subject || 'Multiple Shifts Assigned',
        status: 'sent',
        providerMessageId: data!.id,
        templateVersion: data?.templateVersion,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logSingleEmailResult({
        to,
        templateName,
        subject: 'Multiple Shifts Assigned',
        status: 'failed',
        error,
      });
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  //Send this email manually by admin when wants to notify pharmacists about a specific open available shift
  async emailPharmacistSpecificShiftOpen(to: string, shift: ShiftWithCompany) {
    const templateName = 'open_shift_manual_notification';

    const emailData = {
      companyName: shift.company.name,
      shiftDate: formatDate(shift.startTime, shift.company.timezone),
      startTime: formatTime(shift.startTime, shift.company.timezone),
      endTime: formatTime(shift.endTime, shift.company.timezone),
      shiftTitle: shift.title || '',
      shiftDescription: shift.description || '',
      portalUrl: this.portalUrl,
    };

    try {
      const { data, error } = await this.sendTemplateEmail(
        templateName,
        to,
        emailData,
      );

      if (error) throw new Error(JSON.stringify(error));

      await this.logSingleEmailResult({
        to,
        templateName,
        subject: data?.subject || 'Shift Open',
        status: 'sent',
        providerMessageId: data!.id,
        templateVersion: data?.templateVersion,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logSingleEmailResult({
        to,
        templateName,
        subject: 'Shift Open',
        status: 'failed',
        error,
      });

      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  //Send this email manually by admin when wants to notify pharmacists about multiple open available shifts
  async emailPharmacistMultipleShiftsOpen(to: string, firstName?: string) {
    const templateName = 'multiple_open_shifts_manual_notification';

    const emailData = {
      pharmacistFirstName: firstName || '',
      portalUrl: this.portalUrl,
    };

    try {
      const { data, error } = await this.sendTemplateEmail(
        templateName,
        to,
        emailData,
      );

      if (error) throw new Error(JSON.stringify(error));

      await this.logSingleEmailResult({
        to,
        templateName,
        subject: data?.subject || 'Open Shifts Available',
        status: 'sent',
        providerMessageId: data!.id,
        templateVersion: data?.templateVersion,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logSingleEmailResult({
        to,
        templateName,
        subject: 'Open Shifts Available',
        status: 'failed',
        error,
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

    const emailData = {
      companyName: shift.company.name,
      shiftDate: formatDate(shift.startTime, shift.company.timezone),
      startTime: formatTime(shift.startTime, shift.company.timezone),
      endTime: formatTime(shift.endTime, shift.company.timezone),
      shiftTitle: shift.title || 'N/A',
      shiftDescription: shift.description || '',
      gcalLink: generateGCalLink(shift, this.portalUrl),
      portalUrl: this.portalUrl,
    };

    try {
      const { data, error } = await this.sendTemplateEmail(
        templateName,
        to,
        emailData,
      );

      if (error) throw new Error(JSON.stringify(error));

      await this.logSingleEmailResult({
        to,
        templateName,
        subject: data?.subject || 'Shift Updated',
        status: 'sent',
        providerMessageId: data!.id,
        templateVersion: data?.templateVersion,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logSingleEmailResult({
        to,
        templateName,
        subject: 'Shift Updated',
        status: 'failed',
        error,
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

    const emailData = {
      companyName: shift.company.name,
      shiftDate: formatDate(shift.startTime, shift.company.timezone),
      startTime: formatTime(shift.startTime, shift.company.timezone),
      endTime: formatTime(shift.endTime, shift.company.timezone),
      shiftTitle: shift.title || '',
      shiftDescription: shift.description || '',
      pharmacistName: `${shift?.pharmacist?.user.firstName} ${shift?.pharmacist?.user.lastName}`,
      pharmacistEmail: shift?.pharmacist?.user.email || '',
      cancellationReason,
      portalUrl: this.portalUrl,
    };

    try {
      const { data, error } = await this.sendTemplateBatchEmail(
        templateName,
        adminAndContactPersonEmails,
        emailData,
      );

      if (error) throw new Error(JSON.stringify(error));

      const providerMessageIds = data?.data?.map((d) => d.id) || [];

      await this.logBatchEmailResult({
        emails: adminAndContactPersonEmails,
        templateName,
        subject: data?.subject || 'Shift Cancellation Request',
        status: 'sent',
        providerMessageIds,
        templateVersion: data?.templateVersion,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logBatchEmailResult({
        emails: adminAndContactPersonEmails,
        templateName,
        subject: 'Shift Cancellation Request',
        status: 'failed',
        error,
      });
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

    const emailData = {
      companyName: shift.company.name,
      shiftDate: formatDate(shift.startTime, shift.company.timezone),
      startTime: formatTime(shift.startTime, shift.company.timezone),
      endTime: formatTime(shift.endTime, shift.company.timezone),
      shiftTitle: shift.title || '',
      shiftDescription: shift.description || '',
      portalUrl: this.portalUrl,
    };

    try {
      const { data, error } = await this.sendTemplateEmail(
        templateName,
        to,
        emailData,
      );

      if (error) throw new Error(JSON.stringify(error));

      await this.logSingleEmailResult({
        to,
        templateName,
        subject: data?.subject || 'Shift Cancelled',
        status: 'sent',
        providerMessageId: data!.id,
        templateVersion: data?.templateVersion,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logSingleEmailResult({
        to,
        templateName,
        subject: 'Shift Cancelled',
        status: 'failed',
        error,
      });
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  //Send this email when pharmacist is assigned a series of shifts via update shift series
  async emailPharmacistsShiftSeriesAssigned(
    pharmacistsEmails: string[],
    shifts: ShiftWithCompanyAddress[],
  ) {
    const templateName = 'shift_series_assigned';
    const companyName = shifts[0]?.company?.name || 'pharmacy';

    const shiftsByEmail = shifts.reduce(
      (acc, shift) => {
        const email = shift.pharmacist?.user.email;
        if (email) {
          if (!acc[email]) acc[email] = [];
          acc[email].push(shift);
        }
        return acc;
      },
      {} as Record<string, ShiftWithCompanyAddress[]>,
    );

    try {
      const emailsToProcess = Object.keys(shiftsByEmail);

      if (emailsToProcess.length === 0) return;

      for (const email of emailsToProcess) {
        const userShifts = shiftsByEmail[email] || [];

        const shifts = userShifts.map((shift) => {
          const shiftDate = formatDate(shift.startTime, shift.company.timezone);
          const startTime = formatTime(shift.startTime, shift.company.timezone);
          const endTime = formatTime(shift.endTime, shift.company.timezone);
          return {
            shiftDate,
            startTime,
            endTime,
            title: shift.title || 'N/A',
            description: shift.description || '',
            gcalLink: generateGCalLink(shift, this.portalUrl),
          };
        });

        const emailData = {
          companyName,
          shifts,
          portalUrl: this.portalUrl,
        };

        const { data, error } = await this.sendTemplateEmail(
          templateName,
          email,
          emailData,
        );

        if (error) throw new Error(JSON.stringify(error));

        await this.logSingleEmailResult({
          to: email,
          templateName,
          subject: data?.subject || 'Multiple Shifts Assigned',
          status: 'sent',
          providerMessageId: data!.id,
          templateVersion: data?.templateVersion,
        });
      }

      this.logger.log('Emails sent successfully');
    } catch (error) {
      await Promise.all(
        pharmacistsEmails.map((to) =>
          this.logSingleEmailResult({
            to,
            templateName,
            subject: 'Multiple Shifts Assigned',
            status: 'failed',
            error,
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

  //Send this email when assigned shifts that belong to a series are updated
  async emailPharmacistsShiftSeriesUpdated(
    pharmacistsEmails: string[],
    shifts: ShiftWithPharmacist[],
  ) {
    const templateName = 'taken_shift_series_updated';
    const companyName = shifts[0]?.company?.name || 'pharmacy';

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

    try {
      const emailsToProcess = Object.keys(shiftsByEmail);

      if (emailsToProcess.length === 0) return;

      for (const email of emailsToProcess) {
        const userShifts = shiftsByEmail[email] || [];

        const shifts = userShifts.map((shift) => {
          const shiftDate = formatDate(shift.startTime, shift.company.timezone);
          const startTime = formatTime(shift.startTime, shift.company.timezone);
          const endTime = formatTime(shift.endTime, shift.company.timezone);
          return {
            shiftDate,
            startTime,
            endTime,
            title: shift.title || 'N/A',
            description: shift.description || '',
          };
        });

        const emailData = {
          companyName,
          shifts,
          portalUrl: this.portalUrl,
        };

        const { data, error } = await this.sendTemplateEmail(
          templateName,
          email,
          emailData,
        );

        if (error) throw new Error(JSON.stringify(error));

        await this.logSingleEmailResult({
          to: email,
          templateName,
          subject: data?.subject || 'Multiple Shifts Updated',
          status: 'sent',
          providerMessageId: data!.id,
          templateVersion: data?.templateVersion,
        });
      }

      this.logger.log('Emails sent successfully');
    } catch (error) {
      await Promise.all(
        pharmacistsEmails.map((to) =>
          this.logSingleEmailResult({
            to,
            templateName,
            subject: 'Multiple Shifts Updated',
            status: 'failed',
            error,
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

    try {
      const emailsToProcess = Object.keys(shiftsByEmail);

      if (emailsToProcess.length === 0) return;

      for (const email of emailsToProcess) {
        const userShifts = shiftsByEmail[email] || [];

        const shifts = userShifts.map((shift) => {
          const shiftDate = formatDate(shift.startTime, shift.company.timezone);
          const startTime = formatTime(shift.startTime, shift.company.timezone);
          const endTime = formatTime(shift.endTime, shift.company.timezone);
          return {
            shiftDate,
            startTime,
            endTime,
            title: shift.title || 'N/A',
          };
        });

        const emailData = {
          companyName,
          shifts,
          portalUrl: this.portalUrl,
        };

        const { data, error } = await this.sendTemplateEmail(
          templateName,
          email,
          emailData,
        );

        if (error) throw new Error(JSON.stringify(error));

        await this.logSingleEmailResult({
          to: email,
          templateName,
          subject: data?.subject || 'Multiple Shifts Cancelled',
          status: 'sent',
          providerMessageId: data!.id,
          templateVersion: data?.templateVersion,
        });
      }

      this.logger.log('Emails sent successfully');
    } catch (error) {
      await Promise.all(
        pharmacistsEmails.map((to) =>
          this.logSingleEmailResult({
            to,
            templateName,
            subject: 'Multiple Shifts Cancelled',
            status: 'failed',
            error,
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

  //Send this email when a Shift Cancellation Request is rejected
  async emailPharmacistCancelRequestRejected(
    to: string,
    shift: ShiftWithCompany,
  ) {
    const templateName = 'cancel_request_rejected';

    const emailData = {
      companyName: shift.company.name,
      shiftDate: formatDate(shift.startTime, shift.company.timezone),
      startTime: formatTime(shift.startTime, shift.company.timezone),
      endTime: formatTime(shift.endTime, shift.company.timezone),
      shiftTitle: shift.title || '',
      shiftDescription: shift.description || '',
      portalUrl: this.portalUrl,
    };

    try {
      const { data, error } = await this.sendTemplateEmail(
        templateName,
        to,
        emailData,
      );

      if (error) throw new Error(JSON.stringify(error));

      await this.logSingleEmailResult({
        to,
        templateName,
        subject: data?.subject || 'Shift Cancel Request Rejected',
        status: 'sent',
        providerMessageId: data!.id,
        templateVersion: data?.templateVersion,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logSingleEmailResult({
        to,
        templateName,
        subject: 'Shift Cancel Request Rejected',
        status: 'failed',
        error,
      });
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  //Send this email when a Shift Cancellation Request is approved
  async emailPharmacistCancelRequestApproved(
    to: string,
    shift: ShiftWithCompany,
  ) {
    const templateName = 'cancel_request_approved';

    const emailData = {
      companyName: shift.company.name,
      shiftDate: formatDate(shift.startTime, shift.company.timezone),
      startTime: formatTime(shift.startTime, shift.company.timezone),
      endTime: formatTime(shift.endTime, shift.company.timezone),
      shiftTitle: shift.title || '',
      shiftDescription: shift.description || '',
      portalUrl: this.portalUrl,
    };

    try {
      const { data, error } = await this.sendTemplateEmail(
        templateName,
        to,
        emailData,
      );

      if (error) throw new Error(JSON.stringify(error));

      await this.logSingleEmailResult({
        to,
        templateName,
        subject: data?.subject || 'Shift Cancel Request Approved',
        status: 'sent',
        providerMessageId: data!.id,
        templateVersion: data?.templateVersion,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logSingleEmailResult({
        to,
        templateName,
        subject: 'Shift Cancel Request Approved',
        status: 'failed',
        error,
      });
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  //Send this email when a new user is added to the system
  async emailNewUser(to: string, resetLink: string, firstName?: string) {
    const templateName = 'new_account_created';

    const emailData = {
      firstName: firstName || '',
      resetLink,
    };

    try {
      const { data, error } = await this.sendTemplateEmail(
        templateName,
        to,
        emailData,
      );

      if (error) throw new Error(JSON.stringify(error));

      await this.logSingleEmailResult({
        to,
        templateName,
        subject: data?.subject || 'Account Created',
        status: 'sent',
        providerMessageId: data!.id,
        templateVersion: data?.templateVersion,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logSingleEmailResult({
        to,
        templateName,
        subject: 'Account Created',
        status: 'failed',
        error,
      });
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  //Send this email to admins when a Pharmacist Request is created
  async emailPharmacistRequestCreated(
    adminEmails: string[],
    pharmacistRequest: PharmacistRequest,
    submittedByName: string,
  ) {
    const templateName = 'new_pharmacist_request';

    const emailData = {
      pharmacistFirstName: pharmacistRequest.firstName,
      pharmacistLastName: pharmacistRequest.lastName,
      pharmacistEmail: pharmacistRequest.email,
      submittedByName,
      portalUrl: this.portalUrl,
    };

    try {
      const { data, error } = await this.sendTemplateBatchEmail(
        templateName,
        adminEmails,
        emailData,
      );

      if (error) throw new Error(JSON.stringify(error));

      const providerMessageIds = data?.data?.map((d) => d.id) || [];

      await this.logBatchEmailResult({
        emails: adminEmails,
        templateName,
        subject: data?.subject || 'New Pharmacist Request',
        status: 'sent',
        providerMessageIds,
        templateVersion: data?.templateVersion,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logBatchEmailResult({
        emails: adminEmails,
        templateName,
        subject: 'New Pharmacist Request',
        status: 'failed',
        error,
      });
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  //Send this email when a pharmacist request is approved
  async emailPharmacistRequestApproved(
    to: string,
    pharmacistRequest: PharmacistRequest,
  ) {
    const templateName = 'pharmacist_request_approved';

    const emailData = {
      pharmacistFirstName: pharmacistRequest.firstName,
      pharmacistLastName: pharmacistRequest.lastName,
      pharmacistEmail: pharmacistRequest.email,
      portalUrl: this.portalUrl,
    };

    try {
      const { data, error } = await this.sendTemplateEmail(
        templateName,
        to,
        emailData,
      );

      if (error) throw new Error(JSON.stringify(error));

      await this.logSingleEmailResult({
        to,
        templateName,
        subject: data?.subject || 'Pharmacist Request Approved',
        status: 'sent',
        providerMessageId: data!.id,
        templateVersion: data?.templateVersion,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logSingleEmailResult({
        to,
        templateName,
        subject: 'Pharmacist Request Approved',
        status: 'failed',
        error,
      });
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  //Send this email when a pharmacist request is rejected
  async emailPharmacistRequestRejected(
    to: string,
    pharmacistRequest: PharmacistRequest,
  ) {
    const templateName = 'pharmacist_request_rejected';

    const emailData = {
      pharmacistFirstName: pharmacistRequest.firstName,
      pharmacistLastName: pharmacistRequest.lastName,
      pharmacistEmail: pharmacistRequest.email,
      portalUrl: this.portalUrl,
    };

    try {
      const { data, error } = await this.sendTemplateEmail(
        templateName,
        to,
        emailData,
      );

      if (error) throw new Error(JSON.stringify(error));

      await this.logSingleEmailResult({
        to,
        templateName,
        subject: data?.subject || 'Pharmacist Request Rejected',
        status: 'sent',
        providerMessageId: data!.id,
        templateVersion: data?.templateVersion,
      });

      this.logger.log('Email sent successfully');
      return data;
    } catch (error) {
      await this.logSingleEmailResult({
        to,
        templateName,
        subject: 'Pharmacist Request Rejected',
        status: 'failed',
        error,
      });
      this.logger.error(
        'Unexpected error sending email',
        (error as Error).stack,
      );
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, resetLink: string) {
    const templateName = 'password_reset';

    const emailData = {
      resetLink,
    };

    try {
      const { data, error } = await this.sendTemplateEmail(
        templateName,
        to,
        emailData,
      );

      if (error) throw new Error(JSON.stringify(error));

      await this.logSingleEmailResult({
        to,
        templateName,
        subject: data?.subject || 'Password Reset',
        status: 'sent',
        providerMessageId: data!.id,
        templateVersion: data?.templateVersion,
      });

      this.logger.log('Password reset email sent successfully');
      return data;
    } catch (error) {
      await this.logSingleEmailResult({
        to,
        templateName,
        subject: 'Password Reset',
        status: 'failed',
        error,
      });
      this.logger.error(
        'Unexpected error sending password reset email',
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
    templateVersion?: number;
    errorMessage?: string;
  }) {
    return await this.prisma.emailLog.create({
      data: {
        recipientEmail: params.to,
        subject: params.subject,
        status: params.status,
        templateName: params.templateName,
        providerMessageId: params.providerMessageId,
        templateVersion: params.templateVersion,
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

function generateGCalLink(shift: ShiftWithCompanyAddress, portalUrl: string) {
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
  const appLink = portalUrl;
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

function generateGCalLinkForMultipleDates(shift, dateStr, portalUrl: string) {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';

  const combineDateAndTime = (baseDateStr, timeSource) => {
    if (!baseDateStr || !timeSource) return '';

    const timeIsoStr =
      timeSource instanceof Date
        ? timeSource.toISOString()
        : String(timeSource);

    const datePart = new Date(baseDateStr).toISOString().substring(0, 10);

    const timePart = timeIsoStr.includes('T')
      ? timeIsoStr.split('T')[1]
      : timeIsoStr;

    const combinedIso = `${datePart}T${timePart}`;
    return combinedIso.replace(/[-:]/g, '').replace(/\.\d+/, '');
  };

  const start = combineDateAndTime(dateStr, shift.startTime);
  const end = combineDateAndTime(dateStr, shift.endTime);

  const appLink = portalUrl;
  const eventDetails = `Details: ${shift.title || ''}: ${shift.description || ''} \n\n<a href="${appLink}">Click here to view all details</a>`;

  const params = new URLSearchParams({
    text: `Shift at ${shift.company?.name || 'Company'}`,
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
