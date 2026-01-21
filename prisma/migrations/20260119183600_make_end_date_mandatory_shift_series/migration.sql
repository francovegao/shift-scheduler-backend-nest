/*
  Warnings:

  - Made the column `endDate` on table `ShiftSeries` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."ShiftSeries" ALTER COLUMN "endDate" SET NOT NULL;
