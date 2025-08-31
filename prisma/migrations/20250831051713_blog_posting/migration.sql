/*
  Warnings:

  - You are about to drop the column `author` on the `BlogPost` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `BlogPost` table. All the data in the column will be lost.
  - You are about to drop the column `internalNotes` on the `BlogPost` table. All the data in the column will be lost.
  - You are about to drop the column `shortDescription` on the `BlogPost` table. All the data in the column will be lost.
  - The `status` column on the `BlogPost` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[slug]` on the table `BlogCategory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `BlogTag` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `BlogCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorId` to the `BlogPost` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `content` on the `BlogPost` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `slug` to the `BlogTag` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."BlogStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "public"."BlogCategory" ADD COLUMN     "color" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."BlogPost" DROP COLUMN "author",
DROP COLUMN "image",
DROP COLUMN "internalNotes",
DROP COLUMN "shortDescription",
ADD COLUMN     "authorId" TEXT NOT NULL,
ADD COLUMN     "autosaveDraft" JSONB,
ADD COLUMN     "autosavedAt" TIMESTAMP(3),
ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "featuredImage" TEXT,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastEditedById" TEXT,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "lockedBy" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "readingTime" INTEGER,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "content",
ADD COLUMN     "content" JSONB NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."BlogStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "public"."BlogTag" ADD COLUMN     "color" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."BlogAnalytics" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogAnalytics_postId_idx" ON "public"."BlogAnalytics"("postId");

-- CreateIndex
CREATE INDEX "BlogAnalytics_event_idx" ON "public"."BlogAnalytics"("event");

-- CreateIndex
CREATE INDEX "BlogAnalytics_createdAt_idx" ON "public"."BlogAnalytics"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "public"."BlogCategory"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_authorId_idx" ON "public"."BlogPost"("authorId");

-- CreateIndex
CREATE INDEX "BlogPost_status_idx" ON "public"."BlogPost"("status");

-- CreateIndex
CREATE INDEX "BlogPost_publishedAt_idx" ON "public"."BlogPost"("publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_slug_idx" ON "public"."BlogPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogTag_slug_key" ON "public"."BlogTag"("slug");

-- AddForeignKey
ALTER TABLE "public"."BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlogPost" ADD CONSTRAINT "BlogPost_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlogAnalytics" ADD CONSTRAINT "BlogAnalytics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
