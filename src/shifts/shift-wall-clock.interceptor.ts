import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs';

type ShiftTimes = {
  startTime: Date;
  endTime: Date;
  company: { timezone: string };
  workLogs?: { clockIn: Date | null; clockOut: Date | null }[];
};

export function toCompanyWallClockISO(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
    .format(date)
    .replace(' ', 'T');
}

function hasShiftTimes(value: object): value is ShiftTimes {
  return (
    'startTime' in value &&
    value.startTime instanceof Date &&
    'endTime' in value &&
    value.endTime instanceof Date &&
    'company' in value &&
    typeof value.company === 'object' &&
    value.company !== null &&
    'timezone' in value.company &&
    typeof value.company.timezone === 'string'
  );
}

export function addShiftWallClockTimes(value: unknown, now: Date): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => addShiftWallClockTimes(item, now));
  }
  if (!value || typeof value !== 'object') return value;

  if (hasShiftTimes(value)) {
    const local = (date: Date) =>
      toCompanyWallClockISO(date, value.company.timezone);
    return {
      ...value,
      localStartTime: local(value.startTime),
      localEndTime: local(value.endTime),
      localToday: local(now).slice(0, 10),
      ...(value.workLogs && {
        workLogs: value.workLogs.map((log) => ({
          ...log,
          localClockIn: log.clockIn ? local(log.clockIn) : null,
          localClockOut: log.clockOut ? local(log.clockOut) : null,
        })),
      }),
    };
  }

  if ('data' in value) {
    return { ...value, data: addShiftWallClockTimes(value.data, now) };
  }
  if ('shift' in value) {
    return { ...value, shift: addShiftWallClockTimes(value.shift, now) };
  }
  return value;
}

export class ShiftWallClockInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler<unknown>) {
    return next
      .handle()
      .pipe(map((response) => addShiftWallClockTimes(response, new Date())));
  }
}
