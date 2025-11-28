/*
  Warnings:

  - You are about to drop the `_UserAllowedCompanies` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_UserAllowedCompanies" DROP CONSTRAINT "_UserAllowedCompanies_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_UserAllowedCompanies" DROP CONSTRAINT "_UserAllowedCompanies_B_fkey";

-- DropTable
DROP TABLE "public"."_UserAllowedCompanies";

-- CreateTable
CREATE TABLE "public"."_ManagerAllowedCompanies" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ManagerAllowedCompanies_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ManagerAllowedCompanies_B_index" ON "public"."_ManagerAllowedCompanies"("B");

-- AddForeignKey
ALTER TABLE "public"."_ManagerAllowedCompanies" ADD CONSTRAINT "_ManagerAllowedCompanies_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ManagerAllowedCompanies" ADD CONSTRAINT "_ManagerAllowedCompanies_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
