/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { Parser } from 'json2csv';
import { StorageService } from 'src/storage/storage.service';
import { format, toZonedTime } from 'date-fns-tz';
import { v4 as uuid } from 'uuid';

interface PharmacistSummary {
  pharmacistName: string;
  shiftCount: number;
  scheduledHours: number;
  totalCost: number;
}

interface CompanySummary {
  companyName: string;
  pharmacists: PharmacistSummary[];
  totalShifts: number;
  totalHours: number;
  totalCost: number;
}

interface GrandTotal {
  shiftCount: number;
  scheduledHours: number;
  totalCost: number;
}

interface CompanyReportData {
  companies: CompanySummary[];
  grandTotal: GrandTotal;
}

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async generateCsvReport(generateReportDto: GenerateReportDto) {
    let formatted: any[];
    let fileName: string;

    switch (generateReportDto.type) {
      case 'company':
        {
          const companyData =
            await this.getCompanySummaryReportData(generateReportDto);
          const summary = this.buildCompanySummary(companyData);
          formatted = this.mapCompanySummaryToCsvFormat(summary);
          fileName = this.generateFileName('company');
        }
        break;
      case 'shifts':
      default:
        {
          const shiftsRawData =
            await this.getShiftReportData(generateReportDto);
          formatted = this.mapShiftsRawDataToCsvFormat(shiftsRawData);
          fileName = this.generateFileName('shifts');
        }
        break;
    }

    const csv = this.generateCsv(formatted, generateReportDto.type);
    const url = await this.storageService.uploadCsvAndGetUrl(fileName, csv);

    return { url };
  }

  private generateFileName(type: string): string {
    const dateStamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    return `reports/${type}-${dateStamp}-${uuid()}.csv`;
  }

  async getShiftReportData(generateReportDto: GenerateReportDto) {
    if (generateReportDto.type !== 'shifts') {
      throw new BadRequestException('Invalid report type for shifts summary');
    }

    return this.prisma.shift.findMany({
      where: {
        ...(generateReportDto.startDate && {
          startTime: {
            gte: new Date(generateReportDto.startDate),
          },
        }),
        ...(generateReportDto.endDate && {
          endTime: {
            lte: new Date(generateReportDto.endDate),
          },
        }),
      },
      include: {
        company: true,
        pharmacist: {
          include: {
            user: true,
          },
        },
        workLogs: true,
      },
    });
  }

  async getCompanySummaryReportData(generateReportDto: GenerateReportDto) {
    if (generateReportDto.type !== 'company') {
      throw new BadRequestException('Invalid report type for company summary');
    }

    const startDate = generateReportDto.startDate
      ? new Date(generateReportDto.startDate)
      : null;
    const endDate = generateReportDto.endDate
      ? new Date(generateReportDto.endDate)
      : null;

    let endOfRange: Date | null = null;
    if (endDate) {
      endOfRange = new Date(endDate);
      endOfRange.setDate(endOfRange.getDate() + 1);
    }

    const where: any = {
      pharmacistId: { not: null },
      status: { in: ['taken', 'completed'] },
    };

    if (startDate) {
      where.startTime = { ...where.startTime, gte: startDate };
    }
    if (endOfRange) {
      where.startTime = { ...where.startTime, lt: endOfRange };
    }
    if (generateReportDto.companyIds?.length) {
      where.companyId = { in: generateReportDto.companyIds };
    }

    return this.prisma.shift.findMany({
      where,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        payRate: true,
        status: true,
        companyId: true,
        company: { select: { name: true } },
        pharmacistId: true,
        pharmacist: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
  }

  private buildCompanySummary(rawShifts: any[]): CompanyReportData {
    const companyMap = new Map<string, CompanySummary>();

    for (const shift of rawShifts) {
      const companyName = shift.company?.name ?? 'Unknown Company';
      const pharmacistName = shift.pharmacist?.user
        ? `${shift.pharmacist.user.firstName ?? ''} ${shift.pharmacist.user.lastName ?? ''}`.trim()
        : 'Unknown Pharmacist';

      const scheduledHours =
        (new Date(shift.endTime).getTime() -
          new Date(shift.startTime).getTime()) /
        3_600_000;
      const totalCost = scheduledHours * Number(shift.payRate);

      if (!companyMap.has(companyName)) {
        companyMap.set(companyName, {
          companyName,
          pharmacists: [],
          totalShifts: 0,
          totalHours: 0,
          totalCost: 0,
        });
      }

      const company = companyMap.get(companyName)!;

      let pharmacist = company.pharmacists.find(
        (p) => p.pharmacistName === pharmacistName,
      );
      if (!pharmacist) {
        pharmacist = {
          pharmacistName,
          shiftCount: 0,
          scheduledHours: 0,
          totalCost: 0,
        };
        company.pharmacists.push(pharmacist);
      }

      pharmacist.shiftCount += 1;
      pharmacist.scheduledHours += scheduledHours;
      pharmacist.totalCost += totalCost;

      company.totalShifts += 1;
      company.totalHours += scheduledHours;
      company.totalCost += totalCost;
    }

    const companies = Array.from(companyMap.values());
    const grandTotal: GrandTotal = {
      shiftCount: 0,
      scheduledHours: 0,
      totalCost: 0,
    };

    for (const company of companies) {
      grandTotal.shiftCount += company.totalShifts;
      grandTotal.scheduledHours += company.totalHours;
      grandTotal.totalCost += company.totalCost;
    }

    return { companies, grandTotal };
  }

  private mapCompanySummaryToCsvFormat(data: CompanyReportData) {
    const rows: any[] = [];

    for (const company of data.companies) {
      for (const pharmacist of company.pharmacists) {
        rows.push({
          row_type: 'Pharmacist',
          company_name: company.companyName,
          pharmacist_name: pharmacist.pharmacistName,
          shift_count: pharmacist.shiftCount,
          scheduled_hours: Number(pharmacist.scheduledHours.toFixed(2)),
          total_cost: Number(pharmacist.totalCost.toFixed(2)),
        });
      }

      rows.push({
        row_type: 'Company Total',
        company_name: company.companyName,
        pharmacist_name: '',
        shift_count: company.totalShifts,
        scheduled_hours: Number(company.totalHours.toFixed(2)),
        total_cost: Number(company.totalCost.toFixed(2)),
      });
    }

    rows.push({
      row_type: 'Grand Total',
      company_name: 'All Selected Companies',
      pharmacist_name: '',
      shift_count: data.grandTotal.shiftCount,
      scheduled_hours: Number(data.grandTotal.scheduledHours.toFixed(2)),
      total_cost: Number(data.grandTotal.totalCost.toFixed(2)),
    });

    return rows;
  }

  private mapShiftsRawDataToCsvFormat(shiftsRawData: any) {
    if (!shiftsRawData) return [];

    const mappedData = shiftsRawData.map((shift) => {
      const timezone = shift?.company?.timezone ?? 'America/Edmonton';

      const zonedStart = shift?.startTime
        ? toZonedTime(shift.startTime, timezone)
        : null;
      const zonedEnd = shift?.endTime
        ? toZonedTime(shift.endTime, timezone)
        : null;

      const firstName = shift?.pharmacist?.user?.firstName;
      const lastName = shift?.pharmacist?.user?.lastName;
      const pharmacistName =
        firstName || lastName
          ? `${firstName ?? ''} ${lastName ?? ''}`.trim()
          : '';

      const firstLog = shift?.workLogs?.[0];
      const workLogStart = firstLog?.clockIn
        ? toZonedTime(firstLog?.clockIn, timezone)
        : null;
      const workLogEnd = firstLog?.clockOut
        ? toZonedTime(firstLog?.clockOut, timezone)
        : null;
      const workLogDuration =
        firstLog?.durationHours != null
          ? this.convertDecimalToHoursMinutes(Number(firstLog.durationHours))
          : '0:00 hours';

      const rawPayRate = shift?.payRate != null ? Number(shift.payRate) : 0;
      const rawHours =
        firstLog?.durationHours != null ? Number(firstLog.durationHours) : 0;
      const totalPayFormatted = (rawPayRate * rawHours).toFixed(2);

      return {
        company_name: shift?.company?.name ?? '',
        startTime: zonedStart ? format(zonedStart, 'yyyy-MM-dd HH:mm:ss') : '',
        endTime: zonedEnd ? format(zonedEnd, 'yyyy-MM-dd HH:mm:ss') : '',
        title: shift?.title ?? '',
        description: shift?.description ?? '',
        pay_rate: rawPayRate.toFixed(2),
        status: shift?.status ?? '',
        published: shift?.published === true ? 'Yes' : 'No',
        pharmacist_name: pharmacistName,
        clock_in: workLogStart ? format(workLogStart, 'yyyy-MM-dd HH:mm') : '',
        clock_out: workLogEnd ? format(workLogEnd, 'yyyy-MM-dd HH:mm') : '',
        hours_worked: workLogDuration,
        hours_worked_decimal: rawHours.toFixed(2),
        total_pay: totalPayFormatted,
      };
    });

    return mappedData;
  }

  generateCsv(data: any[], type: string = 'shifts') {
    let fields: string[];

    if (type === 'company') {
      fields = [
        'row_type',
        'company_name',
        'pharmacist_name',
        'shift_count',
        'scheduled_hours',
        'total_cost',
      ];
    } else {
      fields = [
        'company_name',
        'startTime',
        'endTime',
        'title',
        'description',
        'pay_rate',
        'status',
        'published',
        'pharmacist_name',
        'clock_in',
        'clock_out',
        'hours_worked',
        'hours_worked_decimal',
        'total_pay',
      ];
    }

    const parser = new Parser({ fields });
    return parser.parse(data);
  }

  private convertDecimalToHoursMinutes(decimalHours: number): string {
    if (isNaN(decimalHours) || decimalHours <= 0) return '0:00 hours';

    const hours = Math.floor(decimalHours);

    const minutes = Math.round((decimalHours - hours) * 60);

    const paddedMinutes = minutes.toString().padStart(2, '0');

    return `${hours}:${paddedMinutes} hours`;
  }
}
