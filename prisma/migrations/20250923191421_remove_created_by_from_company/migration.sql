/*
  Warnings:

  - You are about to drop the column `createdBy` on the `Company` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Company_createdBy_idx";

-- AlterTable
ALTER TABLE "public"."Company" DROP COLUMN "createdBy";
