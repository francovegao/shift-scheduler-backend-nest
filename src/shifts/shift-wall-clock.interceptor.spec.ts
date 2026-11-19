import {
  addShiftWallClockTimes,
  toCompanyWallClockISO,
} from './shift-wall-clock.interceptor';

describe('shift wall-clock responses', () => {
  it.each([
    ['America/Edmonton', '2026-12-02T10:00:00'],
    ['America/Vancouver', '2026-12-02T09:00:00'],
    ['America/Toronto', '2026-12-02T11:00:00'],
  ])('uses current timezone rules for %s', (zone, expected) => {
    const instant = new Date('2026-12-02T16:00:00Z');
    expect(toCompanyWallClockISO(instant, zone)).toBe(expected);
  });

  it('enriches nested shifts and preserves UTC times and pagination', () => {
    const startTime = new Date('2026-12-02T07:00:00Z');
    const endTime = new Date('2026-12-02T15:00:00Z');
    const shift = {
      startTime,
      endTime,
      company: { timezone: 'America/Vancouver' },
      workLogs: [{ clockIn: startTime, clockOut: null }],
    };
    const meta = { totalItems: 1 };

    expect(
      addShiftWallClockTimes({ data: [{ shift }], meta }, startTime),
    ).toEqual({
      data: [
        {
          shift: {
            ...shift,
            localStartTime: '2026-12-02T00:00:00',
            localEndTime: '2026-12-02T08:00:00',
            localToday: '2026-12-02',
            workLogs: [
              {
                clockIn: startTime,
                clockOut: null,
                localClockIn: '2026-12-02T00:00:00',
                localClockOut: null,
              },
            ],
          },
        },
      ],
      meta,
    });
  });
});
