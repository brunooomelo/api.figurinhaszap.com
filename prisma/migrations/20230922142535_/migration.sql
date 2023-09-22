/*
  Warnings:

  - A unique constraint covering the columns `[kind]` on the table `Analytics` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Analytics_kind_key" ON "Analytics"("kind");
