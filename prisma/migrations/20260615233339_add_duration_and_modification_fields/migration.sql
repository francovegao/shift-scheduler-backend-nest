-- AlterTable
ALTER TABLE "ShiftWorkLog" ADD COLUMN     "durationHours" DOUBLE PRECISION,
ADD COLUMN     "isModified" BOOLEAN NOT NULL DEFAULT false;
