import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { Parser } from 'json2csv';
import { StorageService } from 'src/storage/storage.service';
import { format, toZonedTime } from 'date-fns-tz';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async generateCsvReport(generateReportDto: GenerateReportDto) {
    const rawData = await this.getShiftReportData(generateReportDto);

    const formatted = this.mapToCsvFormat(rawData);

    const csv = this.generateCsv(formatted);

    const dateStamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    const fileName = `reports/${generateReportDto.type}-${dateStamp}.csv`;
    Date.now();
    const url = await this.storageService.uploadCsvAndGetUrl(fileName, csv);

    return { url };
  }

  async getShiftReportData(generateReportDto: GenerateReportDto) {
    if (generateReportDto.type !== 'shifts') {
      throw new BadRequestException('Only shifts reports supported for now');
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

  private mapToCsvFormat(rawData: any) {
    if (!rawData) return [];

    const mappedData = rawData.map((shift) => {
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

  generateCsv(data: any[]) {
    const parser = new Parser({
      fields: [
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
      ],
    });

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
