import { ShiftsController } from './shifts.controller';

describe('ShiftsController.findPharmacistShifts', () => {
  it.each(['upcoming', 'past', undefined] as const)(
    'forwards the %s time filter and existing query arguments',
    (timeFilter) => {
      const service = { findPharmacistShifts: jest.fn() };
      const controller = new ShiftsController(service as any);
      const user = { id: 'user-1' };
      const pagination = { page: 2, limit: 5 };
      const from = new Date('2026-11-01T00:00:00.000Z');
      const to = new Date('2026-11-30T00:00:00.000Z');

      controller.findPharmacistShifts(
        user,
        pagination,
        'clinic',
        'shift-1',
        'taken',
        from,
        to,
        timeFilter,
      );

      expect(service.findPharmacistShifts).toHaveBeenCalledWith(
        user,
        pagination,
        'clinic',
        'shift-1',
        'taken',
        from,
        to,
        timeFilter,
      );
    },
  );
});
