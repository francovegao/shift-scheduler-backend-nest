-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "ShiftCancellationRequest" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "pharmacistId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "ShiftCancellationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShiftCancellationRequest_shiftId_pharmacistId_key" ON "ShiftCancellationRequest"("shiftId", "pharmacistId");

-- AddForeignKey
ALTER TABLE "ShiftCancellationRequest" ADD CONSTRAINT "ShiftCancellationRequest_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftCancellationRequest" ADD CONSTRAINT "ShiftCancellationRequest_pharmacistId_fkey" FOREIGN KEY ("pharmacistId") REFERENCES "PharmacistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
