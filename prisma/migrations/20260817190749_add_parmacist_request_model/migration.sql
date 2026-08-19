-- CreateTable
CREATE TABLE "PharmacistRequest" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "licenseNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "bio" TEXT,
    "experienceYears" INTEGER,
    "eTransferEmail" TEXT,
    "submittedById" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacistRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PharmacistRequest_createdUserId_key" ON "PharmacistRequest"("createdUserId");

-- CreateIndex
CREATE INDEX "PharmacistRequest_submittedById_idx" ON "PharmacistRequest"("submittedById");

-- CreateIndex
CREATE INDEX "PharmacistRequest_status_idx" ON "PharmacistRequest"("status");

-- CreateIndex
CREATE INDEX "PharmacistRequest_email_idx" ON "PharmacistRequest"("email");

-- AddForeignKey
ALTER TABLE "PharmacistRequest" ADD CONSTRAINT "PharmacistRequest_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacistRequest" ADD CONSTRAINT "PharmacistRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacistRequest" ADD CONSTRAINT "PharmacistRequest_createdUserId_fkey" FOREIGN KEY ("createdUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
