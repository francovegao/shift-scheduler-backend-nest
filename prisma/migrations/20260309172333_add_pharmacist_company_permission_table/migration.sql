/*
  Warnings:

  - You are about to drop the `_PharmacistAllowedCompanies` table. If the table is not empty, all the data it contains will be lost.

*/

-- AlterTable
ALTER TABLE "public"."PharmacistProfile" ADD COLUMN  "canViewPayRates" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "public"."PharmacistCompanyPermission" (
    "id" TEXT NOT NULL,
    "pharmacistId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "canViewPayRate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PharmacistCompanyPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PharmacistCompanyPermission_pharmacistId_companyId_key" ON "public"."PharmacistCompanyPermission"("pharmacistId", "companyId");

-- AddForeignKey
ALTER TABLE "public"."PharmacistCompanyPermission" ADD CONSTRAINT "PharmacistCompanyPermission_pharmacistId_fkey" FOREIGN KEY ("pharmacistId") REFERENCES "public"."PharmacistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PharmacistCompanyPermission" ADD CONSTRAINT "PharmacistCompanyPermission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

--Copy from `_PharmacistAllowedCompanies` to new table "PharmacistCompanyPermission"
INSERT INTO "PharmacistCompanyPermission" ("id", "pharmacistId", "companyId", "canViewPayRate")
SELECT 
    gen_random_uuid(),
    "B",
    "A",               
    true              
FROM "_PharmacistAllowedCompanies";

-- DropForeignKey
ALTER TABLE "public"."_PharmacistAllowedCompanies" DROP CONSTRAINT "_PharmacistAllowedCompanies_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_PharmacistAllowedCompanies" DROP CONSTRAINT "_PharmacistAllowedCompanies_B_fkey";

-- DropTable
DROP TABLE "public"."_PharmacistAllowedCompanies";

