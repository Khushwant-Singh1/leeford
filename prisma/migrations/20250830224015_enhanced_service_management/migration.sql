/*
  Warnings:

  - A unique constraint covering the columns `[parentId,position]` on the table `Service` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Service" ADD COLUMN     "depth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "path" TEXT[];

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "public"."Service"("isActive");

-- CreateIndex
CREATE INDEX "Service_depth_idx" ON "public"."Service"("depth");

-- CreateIndex
CREATE UNIQUE INDEX "Service_parentId_position_key" ON "public"."Service"("parentId", "position");
