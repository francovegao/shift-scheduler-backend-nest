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

interface PharmacistEntry {
  pharmacistId: string;
  pharmacistName: string;
  shiftCount: number;
  scheduledHours: number;
  totalCost: number;
}

interface CompanySummary {
  companyId: string;
  companyName: string;
  pharmacists: Map<string, PharmacistEntry>;
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
  companies: Map<string, CompanySummary>;
  grandTotal: GrandTotal;
}

interface CompanyEntry {
  companyId: string;
  companyName: string;
  shiftCount: number;
  scheduledHours: number;
  totalEarned: number;
}

interface PharmacistSummaryData {
  pharmacistId: string;
  pharmacistName: string;
  companies: Map<string, CompanyEntry>;
  totalShifts: number;
  totalHours: number;
  totalEarned: number;
}

interface PharmacistReportData {
  pharmacists: Map<string, PharmacistSummaryData>;
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
          const companySummary = this.buildCompanySummary(companyData);
          formatted = this.mapCompanySummaryToCsvFormat(companySummary);
          fileName = this.generateFileName('company');
        }
        break;
      case 'pharmacist':
        {
          const pharmacistData =
            await this.getPharmacistSummaryReportData(generateReportDto);
          const pharmacistSummary = this.buildPharmacistSummary(pharmacistData);
          formatted = this.mapPharmacistSummaryToCsvFormat(pharmacistSummary);
          fileName = this.generateFileName('pharmacist');
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

  async getPharmacistSummaryReportData(generateReportDto: GenerateReportDto) {
    if (generateReportDto.type !== 'pharmacist') {
      throw new BadRequestException(
        'Invalid report type for pharmacist summary',
      );
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
    if (generateReportDto.pharmacistIds?.length) {
      where.pharmacistId = { in: generateReportDto.pharmacistIds };
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

  private buildPharmacistSummary(rawShifts: any[]): PharmacistReportData {
    const pharmacistMap = new Map<string, PharmacistSummaryData>();

    for (const shift of rawShifts) {
      const pharmacistId = shift.pharmacistId ?? 'unknown';
      const pharmacistName = shift.pharmacist?.user
        ? `${shift.pharmacist.user.firstName ?? ''} ${shift.pharmacist.user.lastName ?? ''}`.trim()
        : 'Unknown Pharmacist';

      const companyId = shift.companyId ?? 'unknown';
      const companyName = shift.company?.name ?? 'Unknown Company';

      const scheduledHours =
        (new Date(shift.endTime).getTime() -
          new Date(shift.startTime).getTime()) /
        3_600_000;
      const totalEarned = scheduledHours * Number(shift.payRate);

      if (!pharmacistMap.has(pharmacistId)) {
        pharmacistMap.set(pharmacistId, {
          pharmacistId,
          pharmacistName,
          companies: new Map(),
          totalShifts: 0,
          totalHours: 0,
          totalEarned: 0,
        });
      }

      const pharmacist = pharmacistMap.get(pharmacistId)!;

      if (!pharmacist.companies.has(companyId)) {
        pharmacist.companies.set(companyId, {
          companyId,
          companyName,
          shiftCount: 0,
          scheduledHours: 0,
          totalEarned: 0,
        });
      }

      const company = pharmacist.companies.get(companyId)!;

      company.shiftCount += 1;
      company.scheduledHours += scheduledHours;
      company.totalEarned += totalEarned;

      pharmacist.totalShifts += 1;
      pharmacist.totalHours += scheduledHours;
      pharmacist.totalEarned += totalEarned;
    }

    const grandTotal: GrandTotal = {
      shiftCount: 0,
      scheduledHours: 0,
      totalCost: 0,
    };

    for (const pharmacist of pharmacistMap.values()) {
      grandTotal.shiftCount += pharmacist.totalShifts;
      grandTotal.scheduledHours += pharmacist.totalHours;
      grandTotal.totalCost += pharmacist.totalEarned;
    }

    return { pharmacists: pharmacistMap, grandTotal };
  }

  private mapPharmacistSummaryToCsvFormat(data: PharmacistReportData) {
    const rows: any[] = [];

    const sortedPharmacists = Array.from(data.pharmacists.values()).sort(
      (a, b) => a.pharmacistName.localeCompare(b.pharmacistName),
    );

    for (const pharmacist of sortedPharmacists) {
      const sortedCompanies = Array.from(pharmacist.companies.values()).sort(
        (a, b) => a.companyName.localeCompare(b.companyName),
      );

      for (const company of sortedCompanies) {
        rows.push({
          row_type: 'Pharmacist',
          pharmacist_name: pharmacist.pharmacistName,
          company_name: company.companyName,
          shift_count: company.shiftCount,
          scheduled_hours: Number(company.scheduledHours.toFixed(2)),
          total_earned: Number(company.totalEarned.toFixed(2)),
        });
      }

      rows.push({
        row_type: 'Pharmacist Total',
        pharmacist_name: pharmacist.pharmacistName,
        company_name: '',
        shift_count: pharmacist.totalShifts,
        scheduled_hours: Number(pharmacist.totalHours.toFixed(2)),
        total_earned: Number(pharmacist.totalEarned.toFixed(2)),
      });
    }

    rows.push({
      row_type: 'Grand Total',
      pharmacist_name: 'All Selected Pharmacists',
      company_name: 'All Companies',
      shift_count: data.grandTotal.shiftCount,
      scheduled_hours: Number(data.grandTotal.scheduledHours.toFixed(2)),
      total_earned: Number(data.grandTotal.totalCost.toFixed(2)),
    });

    return rows;
  }

  private buildCompanySummary(rawShifts: any[]): CompanyReportData {
    const companyMap = new Map<string, CompanySummary>();

    for (const shift of rawShifts) {
      const companyId = shift.companyId ?? 'unknown';
      const companyName = shift.company?.name ?? 'Unknown Company';
      const pharmacistId = shift.pharmacistId ?? 'unknown';
      const pharmacistName = shift.pharmacist?.user
        ? `${shift.pharmacist.user.firstName ?? ''} ${shift.pharmacist.user.lastName ?? ''}`.trim()
        : 'Unknown Pharmacist';

      const scheduledHours =
        (new Date(shift.endTime).getTime() -
          new Date(shift.startTime).getTime()) /
        3_600_000;
      const totalCost = scheduledHours * Number(shift.payRate);

      if (!companyMap.has(companyId)) {
        companyMap.set(companyId, {
          companyId,
          companyName,
          pharmacists: new Map(),
          totalShifts: 0,
          totalHours: 0,
          totalCost: 0,
        });
      }

      const company = companyMap.get(companyId)!;

      if (!company.pharmacists.has(pharmacistId)) {
        company.pharmacists.set(pharmacistId, {
          pharmacistId,
          pharmacistName,
          shiftCount: 0,
          scheduledHours: 0,
          totalCost: 0,
        });
      }

      const pharmacist = company.pharmacists.get(pharmacistId)!;

      pharmacist.shiftCount += 1;
      pharmacist.scheduledHours += scheduledHours;
      pharmacist.totalCost += totalCost;

      company.totalShifts += 1;
      company.totalHours += scheduledHours;
      company.totalCost += totalCost;
    }

    const grandTotal: GrandTotal = {
      shiftCount: 0,
      scheduledHours: 0,
      totalCost: 0,
    };

    for (const company of companyMap.values()) {
      grandTotal.shiftCount += company.totalShifts;
      grandTotal.scheduledHours += company.totalHours;
      grandTotal.totalCost += company.totalCost;
    }

    return { companies: companyMap, grandTotal };
  }

  private mapCompanySummaryToCsvFormat(data: CompanyReportData) {
    const rows: any[] = [];

    const sortedCompanies = Array.from(data.companies.values()).sort((a, b) =>
      a.companyName.localeCompare(b.companyName),
    );

    for (const company of sortedCompanies) {
      const sortedPharmacists = Array.from(company.pharmacists.values()).sort(
        (a, b) => a.pharmacistName.localeCompare(b.pharmacistName),
      );

      for (const pharmacist of sortedPharmacists) {
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
    } else if (type === 'pharmacist') {
      fields = [
        'row_type',
        'pharmacist_name',
        'company_name',
        'shift_count',
        'scheduled_hours',
        'total_earned',
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
