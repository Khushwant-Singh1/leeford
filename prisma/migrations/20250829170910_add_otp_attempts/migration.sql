-- AlterTable
ALTER TABLE "public"."VerificationCode" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usedAt" TIMESTAMP(3);
