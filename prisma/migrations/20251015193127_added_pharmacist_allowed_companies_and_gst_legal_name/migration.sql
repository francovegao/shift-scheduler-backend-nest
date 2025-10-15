-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "GSTNumber" TEXT,
ADD COLUMN     "legalName" TEXT;

-- AlterTable
ALTER TABLE "public"."Location" ADD COLUMN     "GSTNumber" TEXT,
ADD COLUMN     "legalName" TEXT;

-- AlterTable
ALTER TABLE "public"."PharmacistProfile" ADD COLUMN     "canViewAllCompanies" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."_PharmacistAllowedCompanies" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PharmacistAllowedCompanies_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PharmacistAllowedCompanies_B_index" ON "public"."_PharmacistAllowedCompanies"("B");

-- AddForeignKey
ALTER TABLE "public"."_PharmacistAllowedCompanies" ADD CONSTRAINT "_PharmacistAllowedCompanies_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PharmacistAllowedCompanies" ADD CONSTRAINT "_PharmacistAllowedCompanies_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."PharmacistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
