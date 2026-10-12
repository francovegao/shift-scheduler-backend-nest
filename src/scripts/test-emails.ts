/* eslint-disable @typescript-eslint/no-unsafe-return */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EmailService } from '../email/email.service';
import { EmailTemplateRendererService } from '../email/email-template-renderer.service';
import { PrismaService } from '../prisma/prisma.service';
import { Shift, PharmacistRequest } from '../../generated/prisma/client';

/**
 * Test script to send all email templates to a test email address
 * Usage: npx tsx src/scripts/test-emails.ts
 */

// ==========================================
// CONFIGURATION
// ==========================================

const TEST_EMAIL = 'email@example.com';
const TEST_COMPANY_NAME = 'CurisRx Pharmacy - Downtown';
const TEST_TIMEZONE = 'America/Edmonton';

// ==========================================
// MOCK DATA FACTORIES
// ==========================================

function createMockShiftWithCompanyAddress(
  overrides: Partial<{
    startTime: Date;
    endTime: Date;
    title: string;
    description: string;
  }> = {},
): Shift & {
  company: {
    name: string;
    timezone: string;
    address: string | null;
    city: string | null;
    province: string | null;
  };
  pharmacist: { user: { email: string; firstName: string | null } } | null;
} {
  const now = new Date();
  const startTime =
    overrides.startTime || new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const endTime =
    overrides.endTime || new Date(startTime.getTime() + 8 * 60 * 60 * 1000);

  return {
    id: 'test-shift-1',
    companyId: 'test-company-1',
    pharmacistId: 'test-pharmacist-1',
    startTime,
    endTime,
    title: overrides.title || 'Day Shift',
    description: overrides.description || 'Regular day shift at the pharmacy',
    status: 'ASSIGNED',
    shiftSeriesId: null,
    createdAt: now,
    updatedAt: now,
    company: {
      name: TEST_COMPANY_NAME,
      timezone: TEST_TIMEZONE,
      address: '123 Main Street',
      city: 'Edmonton',
      province: 'AB',
    },
    pharmacist: {
      user: {
        email: TEST_EMAIL,
        firstName: 'John',
      },
    },
  } as any;
}

function createMockShiftWithCompany(
  overrides: Partial<{
    startTime: Date;
    endTime: Date;
    title: string;
    description: string;
  }> = {},
): Shift & {
  company: {
    name: string;
    timezone: string;
    contactName: string | null;
    contactEmail: string | null;
  };
} {
  const now = new Date();
  const startTime =
    overrides.startTime || new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const endTime =
    overrides.endTime || new Date(startTime.getTime() + 8 * 60 * 60 * 1000);

  return {
    id: 'test-shift-2',
    companyId: 'test-company-1',
    pharmacistId: 'test-pharmacist-1',
    startTime,
    endTime,
    title: overrides.title || 'Evening Shift',
    description: overrides.description || 'Evening shift coverage needed',
    status: 'OPEN',
    shiftSeriesId: null,
    createdAt: now,
    updatedAt: now,
    company: {
      name: TEST_COMPANY_NAME,
      timezone: TEST_TIMEZONE,
      contactName: 'Jane Manager',
      contactEmail: 'manager@pharmacy.com',
    },
  } as any;
}

function createMockShiftWithPharmacist(
  overrides: Partial<{
    startTime: Date;
    endTime: Date;
    title: string;
    description: string;
    pharmacistName: string;
  }> = {},
): Shift & {
  company: {
    name: string;
    timezone: string;
    contactName: string | null;
    contactEmail: string | null;
  };
  pharmacist: {
    user: { email: string; firstName: string | null; lastName: string | null };
  } | null;
} {
  const now = new Date();
  const startTime =
    overrides.startTime || new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const endTime =
    overrides.endTime || new Date(startTime.getTime() + 8 * 60 * 60 * 1000);

  return {
    id: 'test-shift-3',
    companyId: 'test-company-1',
    pharmacistId: 'test-pharmacist-1',
    startTime,
    endTime,
    title: overrides.title || 'Night Shift',
    description: overrides.description || 'Overnight coverage',
    status: 'TAKEN',
    shiftSeriesId: null,
    createdAt: now,
    updatedAt: now,
    company: {
      name: TEST_COMPANY_NAME,
      timezone: TEST_TIMEZONE,
      contactName: 'Jane Manager',
      contactEmail: 'manager@pharmacy.com',
    },
    pharmacist: {
      user: {
        email: TEST_EMAIL,
        firstName: overrides.pharmacistName?.split(' ')[0] || 'John',
        lastName: overrides.pharmacistName?.split(' ')[1] || 'Doe',
      },
    },
  } as any;
}

function createMockPharmacistRequest(
  overrides: Partial<{
    firstName: string;
    lastName: string;
    email: string;
  }> = {},
): PharmacistRequest {
  return {
    id: 'test-request-1',
    firstName: overrides.firstName || 'Jane',
    lastName: overrides.lastName || 'Miller',
    email: overrides.email || TEST_EMAIL,
    licenseNumber: 'LIC-12345',
    status: 'PENDING',
    requestedById: 'admin-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;
}

function createMockShiftsArray(count: number = 3): Array<
  Shift & {
    company: {
      name: string;
      timezone: string;
      address: string | null;
      city: string | null;
      province: string | null;
    };
    pharmacist: { user: { email: string; firstName: string | null } } | null;
  }
> {
  return Array.from({ length: count }, (_, i) =>
    createMockShiftWithCompanyAddress({
      startTime: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
      title: `Shift ${i + 1}`,
    }),
  );
}

function createMockShiftsWithPharmacistArray(count: number = 3): Array<
  Shift & {
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
  }
> {
  return Array.from({ length: count }, (_, i) =>
    createMockShiftWithPharmacist({
      startTime: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
      title: `Series Shift ${i + 1}`,
    }),
  );
}

// ==========================================
// TEST RUNNER
// ==========================================

async function run() {
  console.log('🚀 Initializing NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const emailService = app.get(EmailService);
  const prisma = app.get(PrismaService);
  const templateRenderer = app.get(EmailTemplateRendererService);
  console.log('✅ Services retrieved from container\n');

  // Ensure DI worked (fallback for test context)
  if (!emailService['prisma']) {
    emailService['prisma'] = prisma;
    emailService['emailTemplateRenderer'] = templateRenderer;
  }
  if (!templateRenderer['prisma']) {
    templateRenderer['prisma'] = prisma;
  }

  // Check database connectivity
  let dbAvailable = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbAvailable = true;
    console.log('✅ Database connection verified\n');
  } catch (error) {
    console.log(
      '⚠️  Database not accessible - email template rendering will fail',
    );
    console.log(
      '   This script requires a database connection to fetch email templates.',
    );
    console.log(
      '   Run this script inside the DevContainer or ensure DATABASE_URL is accessible.\n',
    );
  }

  const results: {
    name: string;
    success: boolean;
    error?: string;
    skipped?: boolean;
  }[] = [];

  async function test(name: string, fn: () => Promise<void>) {
    console.log(`\n📧 Testing: ${name}`);
    if (!dbAvailable) {
      console.log(`   ⏭️  Skipped (database not available)`);
      results.push({
        name,
        success: false,
        error: 'Database not available',
        skipped: true,
      });
      return;
    }
    try {
      await fn();
      console.log(`   ✅ Success`);
      results.push({ name, success: true });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ Failed: ${msg}`);
      results.push({ name, success: false, error: msg });
    }
  }

  // ==========================================
  // SINGLE EMAIL TESTS
  // ==========================================

  // 1. emailPharmacistShiftAssigned
  await test('emailPharmacistShiftAssigned', async () => {
    const shift = createMockShiftWithCompanyAddress();
    await emailService.emailPharmacistShiftAssigned(TEST_EMAIL, shift);
  });

  // 2. emailPharmacistShiftTaken
  await test('emailPharmacistShiftTaken', async () => {
    const shift = createMockShiftWithCompanyAddress();
    await emailService.emailPharmacistShiftTaken(TEST_EMAIL, shift);
  });

  // 3. emailPharmacistMultipleShiftsAssigned
  await test('emailPharmacistMultipleShiftsAssigned', async () => {
    const shift = createMockShiftWithCompanyAddress();
    const shiftsDates = [
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().split('T')[0],
    ];
    await emailService.emailPharmacistMultipleShiftsAssigned(
      TEST_EMAIL,
      shift,
      shiftsDates,
    );
  });

  // 4. emailPharmacistSpecificShiftOpen
  await test('emailPharmacistSpecificShiftOpen', async () => {
    const shift = createMockShiftWithCompany();
    await emailService.emailPharmacistSpecificShiftOpen(TEST_EMAIL, shift);
  });

  // 5. emailPharmacistMultipleShiftsOpen
  await test('emailPharmacistMultipleShiftsOpen', async () => {
    await emailService.emailPharmacistMultipleShiftsOpen(TEST_EMAIL, 'John');
  });

  // 6. emailPharmacistShiftUpdated
  await test('emailPharmacistShiftUpdated', async () => {
    const shift = createMockShiftWithCompanyAddress();
    await emailService.emailPharmacistShiftUpdated(TEST_EMAIL, shift);
  });

  // 7. emailPharmacistShiftCancelled
  await test('emailPharmacistShiftCancelled', async () => {
    const shift = createMockShiftWithCompany();
    await emailService.emailPharmacistShiftCancelled(TEST_EMAIL, shift);
  });

  // 8. emailPharmacistCancelRequestRejected
  await test('emailPharmacistCancelRequestRejected', async () => {
    const shift = createMockShiftWithCompany();
    await emailService.emailPharmacistCancelRequestRejected(TEST_EMAIL, shift);
  });

  // 9. emailPharmacistCancelRequestApproved
  await test('emailPharmacistCancelRequestApproved', async () => {
    const shift = createMockShiftWithCompany();
    await emailService.emailPharmacistCancelRequestApproved(TEST_EMAIL, shift);
  });

  // 10. emailNewUser
  await test('emailNewUser', async () => {
    const resetLink =
      'https://shifthappens.vercel.app/reset_password?token=test-token-123';
    await emailService.emailNewUser(TEST_EMAIL, resetLink, 'John');
  });

  11. emailPharmacistRequestApproved
  await test('emailPharmacistRequestApproved', async () => {
    const request = createMockPharmacistRequest({
      firstName: 'Jane',
      lastName: 'Miller',
    });
    await emailService.emailPharmacistRequestApproved(TEST_EMAIL, request);
  });

  // 12. emailPharmacistRequestRejected
  await test('emailPharmacistRequestRejected', async () => {
    const request = createMockPharmacistRequest({
      firstName: 'Bob',
      lastName: 'Smith',
    });
    await emailService.emailPharmacistRequestRejected(TEST_EMAIL, request);
  });

  // 13. sendPasswordResetEmail
  await test('sendPasswordResetEmail', async () => {
    const resetLink =
      'https://shifthappens.vercel.app/reset_password?token=test-token-456';
    await emailService.sendPasswordResetEmail(TEST_EMAIL, resetLink);
  });

  // ==========================================
  // BATCH EMAIL TESTS
  // ==========================================

  const managerEmails = [TEST_EMAIL];

  // 14. emailManagersShiftTaken
  await test('emailManagersShiftTaken', async () => {
    const shift = createMockShiftWithCompany();
    await emailService.emailManagersShiftTaken(
      managerEmails,
      shift,
      'John Doe',
    );
  });

  // 15. emailRequestShiftCancellation
  await test('emailRequestShiftCancellation', async () => {
    const shift = createMockShiftWithPharmacist({ pharmacistName: 'John Doe' });
    await emailService.emailRequestShiftCancellation(
      managerEmails,
      shift,
      'Family emergency',
    );
  });

  // 16. emailPharmacistRequestCreated
  await test('emailPharmacistRequestCreated', async () => {
    const request = createMockPharmacistRequest({
      firstName: 'New',
      lastName: 'Pharmacist',
    });
    await emailService.emailPharmacistRequestCreated(
      managerEmails,
      request,
      'Admin User',
    );
  });

  // 17. emailPharmacistsShiftSeriesAssigned
  await test('emailPharmacistsShiftSeriesAssigned', async () => {
    const shifts = createMockShiftsArray(2);
    await emailService.emailPharmacistsShiftSeriesAssigned(
      [TEST_EMAIL],
      shifts,
    );
  });

  // 18. emailPharmacistsShiftSeriesUpdated
  await test('emailPharmacistsShiftSeriesUpdated', async () => {
    const shifts = createMockShiftsWithPharmacistArray(2);
    await emailService.emailPharmacistsShiftSeriesUpdated([TEST_EMAIL], shifts);
  });

  // 19. emailPharmacistsShiftSeriesCancelled
  await test('emailPharmacistsShiftSeriesCancelled', async () => {
    const shifts = createMockShiftsWithPharmacistArray(2);
    await emailService.emailPharmacistsShiftSeriesCancelled(
      [TEST_EMAIL],
      shifts,
    );
  });

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success && !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;

  results.forEach((r) => {
    if (r.skipped) {
      console.log(`  ⏭️  ${r.name} - Skipped (database not available)`);
    } else {
      console.log(
        `  ${r.success ? '✅' : '❌'} ${r.name}${r.error ? ` - ${r.error}` : ''}`,
      );
    }
  });

  console.log(
    `\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`,
  );

  if (!dbAvailable) {
    console.log('\n💡 To run these tests, ensure database is accessible:');
    console.log(
      '   1. Run inside DevContainer: docker compose -f .devcontainer/docker-compose.yml up -d',
    );
    console.log(
      '   2. Or ensure DATABASE_URL in .env points to an accessible PostgreSQL instance',
    );
    console.log('   3. Run database migrations: npx prisma migrate deploy');
    console.log(
      '   4. Seed email templates: npx tsx prisma/seed-email-templates.ts',
    );
    process.exitCode = 0;
  } else if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check output above for details.');
    process.exitCode = 1;
  } else {
    console.log('\n🎉 All tests passed! Check your inbox at ' + TEST_EMAIL);
  }

  await app.close();
}

run().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
