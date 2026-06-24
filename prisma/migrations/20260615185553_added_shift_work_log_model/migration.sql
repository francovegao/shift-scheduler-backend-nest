-- CreateTable
CREATE TABLE "ShiftWorkLog" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "pharmacistId" TEXT NOT NULL,
    "clockIn" TIMESTAMP(3),
    "clockOut" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftWorkLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShiftWorkLog_shiftId_idx" ON "ShiftWorkLog"("shiftId");

-- CreateIndex
CREATE INDEX "ShiftWorkLog_pharmacistId_idx" ON "ShiftWorkLog"("pharmacistId");

-- AddForeignKey
ALTER TABLE "ShiftWorkLog" ADD CONSTRAINT "ShiftWorkLog_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftWorkLog" ADD CONSTRAINT "ShiftWorkLog_pharmacistId_fkey" FOREIGN KEY ("pharmacistId") REFERENCES "PharmacistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
