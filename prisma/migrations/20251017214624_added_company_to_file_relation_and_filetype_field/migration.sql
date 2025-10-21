-- CreateEnum
CREATE TYPE "public"."FileType" AS ENUM ('resume', 'logo', 'document');

-- DropIndex
DROP INDEX "public"."File_userId_idx";

-- AlterTable
ALTER TABLE "public"."File" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "size" INTEGER,
ADD COLUMN     "type" "public"."FileType",
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
