import { PrismaService } from 'src/prisma/prisma.service';
import { ShiftWorkLogsService } from './shift-work-logs.service';

describe('ShiftWorkLogsService', () => {
  it('converts an overnight end after a daylight saving change', async () => {
    const prisma = {
      shift: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'shift-1',
          startTime: new Date('2026-03-08T04:00:00Z'),
          company: { timezone: 'America/New_York' },
        }),
      },
      shiftWorkLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const service = new ShiftWorkLogsService(
      prisma as unknown as PrismaService,
    );

    await service.upsertWorkLog({
      shiftId: 'shift-1',
      pharmacistId: 'pharmacist-1',
      startMinutes: 23 * 60,
      endMinutes: 3 * 60,
    });

    expect(prisma.shiftWorkLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clockIn: new Date('2026-03-08T04:00:00Z'),
        clockOut: new Date('2026-03-08T07:00:00Z'),
        durationHours: 3,
      }),
    });
  });
});
