-- AlterTable
ALTER TABLE "public"."Shift" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Shift_published_idx" ON "public"."Shift"("published");
