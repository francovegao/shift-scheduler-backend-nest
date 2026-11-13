import { ShiftsService } from './shifts.service';

describe('ShiftsService.findPharmacistShifts', () => {
  const now = new Date('2026-11-13T12:00:00.000Z');
  const currentUser = { id: 'user-1', role: 'relief_pharmacist' };
  const pharmacist = {
    companyPermissions: [{ companyId: 'company-1', canViewPayRate: false }],
  };
  const shift = { id: 'shift-1', companyId: 'company-1', payRate: '80' };
  let prisma: any;
  let service: ShiftsService;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    prisma = {
      pharmacistProfile: {
        findUnique: jest.fn().mockResolvedValue(pharmacist),
      },
      shift: {
        findMany: jest.fn().mockResolvedValue([shift]),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    service = new ShiftsService(prisma, {} as any, {} as any);
  });

  afterEach(() => jest.useRealTimers());

  it.each([
    ['upcoming', { startTime: { gte: now } }],
    ['past', { endTime: { lt: now } }],
  ] as const)(
    'applies %s boundary to list and count with existing filters',
    async (filter, boundary) => {
      const result = await service.findPharmacistShifts(
        currentUser,
        { page: 2, limit: 5 },
        'clinic',
        'shift-1',
        'taken',
        new Date('2026-11-01T00:00:00.000Z'),
        new Date('2026-11-30T00:00:00.000Z'),
        filter,
      );

      const listArgs = prisma.shift.findMany.mock.calls[0][0];
      const countArgs = prisma.shift.count.mock.calls[0][0];
      expect(countArgs.where).toBe(listArgs.where);
      expect(listArgs).toMatchObject({ skip: 5, take: 5 });
      expect(listArgs.where.AND).toEqual(
        expect.arrayContaining([
          { pharmacist: { userId: 'user-1' } },
          { id: 'shift-1' },
          { status: { equals: 'taken' } },
          {
            startTime: {
              gte: new Date('2026-11-01T00:00:00.000Z'),
              lte: new Date('2026-11-30T00:00:00.000Z'),
            },
          },
          boundary,
        ]),
      );
      expect(
        listArgs.where.AND.some((condition: any) =>
          condition.OR?.some(
            (clause: any) => clause.title?.contains === 'clinic',
          ),
        ),
      ).toBe(true);
      expect(result.data[0].payRate).toBe('No Data');
      expect(result.meta).toMatchObject({
        totalItems: 1,
        currentPage: 2,
        totalPages: 1,
      });
    },
  );

  it('leaves the full list unfiltered when timeFilter is omitted', async () => {
    const result = await service.findPharmacistShifts(currentUser, {
      page: 1,
      limit: 10,
    });
    const where = prisma.shift.findMany.mock.calls[0][0].where;
    expect(where.AND).not.toContainEqual({ startTime: { gte: now } });
    expect(where.AND).not.toContainEqual({ endTime: { lt: now } });
    expect(where.AND).toContainEqual({ pharmacist: { userId: 'user-1' } });
    expect(result.data[0].payRate).toBe('No Data');
  });
});
