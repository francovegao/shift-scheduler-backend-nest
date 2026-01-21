-- CreateEnum
CREATE TYPE "public"."RepeatType" AS ENUM ('NONE', 'DAILY', 'WEEKLY');

-- AlterTable
ALTER TABLE "public"."Shift" ADD COLUMN     "seriesId" TEXT;

-- CreateTable
CREATE TABLE "public"."ShiftSeries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "locationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "payRate" DOUBLE PRECISION NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "repeatType" "public"."RepeatType" NOT NULL,
    "daysOfWeek" INTEGER[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "excludeWeekends" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftSeries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shift_seriesId_idx" ON "public"."Shift"("seriesId");

-- AddForeignKey
ALTER TABLE "public"."Shift" ADD CONSTRAINT "Shift_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "public"."ShiftSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftSeries" ADD CONSTRAINT "ShiftSeries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftSeries" ADD CONSTRAINT "ShiftSeries_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
