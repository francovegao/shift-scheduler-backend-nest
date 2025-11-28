-- CreateTable
CREATE TABLE "public"."_UserAllowedCompanies" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserAllowedCompanies_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UserAllowedCompanies_B_index" ON "public"."_UserAllowedCompanies"("B");

-- AddForeignKey
ALTER TABLE "public"."_UserAllowedCompanies" ADD CONSTRAINT "_UserAllowedCompanies_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserAllowedCompanies" ADD CONSTRAINT "_UserAllowedCompanies_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
