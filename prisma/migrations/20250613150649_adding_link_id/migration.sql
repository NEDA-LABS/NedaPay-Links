/*
  Warnings:

  - A unique constraint covering the columns `[linkId]` on the table `PaymentLink` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PaymentLink" ADD COLUMN     "linkId" CHAR(32) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PaymentLink_linkId_key" ON "PaymentLink"("linkId");
