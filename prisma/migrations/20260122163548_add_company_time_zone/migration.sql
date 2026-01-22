-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Edmonton';

-- AlterTable
ALTER TABLE "public"."Location" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Edmonton';
