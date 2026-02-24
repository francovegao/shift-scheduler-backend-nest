-- CreateEnum
CREATE TYPE "public"."EmailStatus" AS ENUM ('sent', 'failed');

-- CreateTable
CREATE TABLE "public"."EmailLog" (
    "id" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "userId" TEXT,
    "subject" TEXT NOT NULL,
    "templateName" TEXT,
    "status" "public"."EmailStatus" NOT NULL,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
