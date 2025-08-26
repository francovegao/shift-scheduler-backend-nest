/*
  Warnings:

  - You are about to drop the `ShiftAssignment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[locationId,startTime]` on the table `Shift` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'location_manager';

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Shift" DROP CONSTRAINT "Shift_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShiftAssignment" DROP CONSTRAINT "ShiftAssignment_pharmacistId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShiftAssignment" DROP CONSTRAINT "ShiftAssignment_shiftId_fkey";

-- AlterTable
ALTER TABLE "public"."Shift" ADD COLUMN     "pharmacistId" TEXT;

-- AlterTable
ALTER TABLE "public"."UserRole" ADD COLUMN     "locationId" TEXT;

-- DropTable
DROP TABLE "public"."ShiftAssignment";

-- CreateIndex
CREATE INDEX "Company_createdBy_idx" ON "public"."Company"("createdBy");

-- CreateIndex
CREATE INDEX "File_userId_idx" ON "public"."File"("userId");

-- CreateIndex
CREATE INDEX "Location_companyId_idx" ON "public"."Location"("companyId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Shift_companyId_idx" ON "public"."Shift"("companyId");

-- CreateIndex
CREATE INDEX "Shift_locationId_idx" ON "public"."Shift"("locationId");

-- CreateIndex
CREATE INDEX "Shift_pharmacistId_idx" ON "public"."Shift"("pharmacistId");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_locationId_startTime_key" ON "public"."Shift"("locationId", "startTime");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "public"."UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_companyId_idx" ON "public"."UserRole"("companyId");

-- CreateIndex
CREATE INDEX "UserRole_locationId_idx" ON "public"."UserRole"("locationId");

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shift" ADD CONSTRAINT "Shift_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shift" ADD CONSTRAINT "Shift_pharmacistId_fkey" FOREIGN KEY ("pharmacistId") REFERENCES "public"."PharmacistProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
