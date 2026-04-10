/*
  Warnings:

  - A unique constraint covering the columns `[userId,type]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,type]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,type]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "unique_user_resume" ON "File"("userId", "type") WHERE ("type" = 'resume');

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_profile_pic" ON "File"("userId", "type") WHERE ("type" = 'profilePicture');

-- CreateIndex
CREATE UNIQUE INDEX "unique_company_logo" ON "File"("companyId", "type") WHERE ("type" = 'logo');
