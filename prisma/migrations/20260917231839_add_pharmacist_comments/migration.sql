-- CreateTable
CREATE TABLE "PharmacistComment" (
    "id" TEXT NOT NULL,
    "pharmacistId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "companyId" TEXT,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacistComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PharmacistComment_pharmacistId_idx" ON "PharmacistComment"("pharmacistId");

-- CreateIndex
CREATE INDEX "PharmacistComment_authorId_idx" ON "PharmacistComment"("authorId");

-- CreateIndex
CREATE INDEX "PharmacistComment_companyId_idx" ON "PharmacistComment"("companyId");

-- CreateIndex
CREATE INDEX "PharmacistComment_locationId_idx" ON "PharmacistComment"("locationId");

-- CreateIndex
CREATE INDEX "PharmacistComment_createdAt_idx" ON "PharmacistComment"("createdAt");

-- AddForeignKey
ALTER TABLE "PharmacistComment" ADD CONSTRAINT "PharmacistComment_pharmacistId_fkey" FOREIGN KEY ("pharmacistId") REFERENCES "PharmacistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacistComment" ADD CONSTRAINT "PharmacistComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacistComment" ADD CONSTRAINT "PharmacistComment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacistComment" ADD CONSTRAINT "PharmacistComment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
