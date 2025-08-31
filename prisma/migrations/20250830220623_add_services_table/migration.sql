-- CreateEnum
CREATE TYPE "public"."SecurityEventLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "public"."Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SecurityLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "level" "public"."SecurityEventLevel" NOT NULL,
    "actor" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" JSONB NOT NULL,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "public"."Service"("slug");

-- CreateIndex
CREATE INDEX "Service_parentId_idx" ON "public"."Service"("parentId");

-- CreateIndex
CREATE INDEX "SecurityLog_createdAt_idx" ON "public"."SecurityLog"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityLog_eventType_idx" ON "public"."SecurityLog"("eventType");

-- CreateIndex
CREATE INDEX "SecurityLog_actor_idx" ON "public"."SecurityLog"("actor");

-- AddForeignKey
ALTER TABLE "public"."Service" ADD CONSTRAINT "Service_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
