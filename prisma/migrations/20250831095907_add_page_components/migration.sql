-- CreateEnum
CREATE TYPE "public"."PageComponentType" AS ENUM ('HEADING', 'TEXT_BLOCK', 'IMAGE', 'IMAGE_CAROUSEL', 'VIDEO_EMBED', 'REVIEW_CARD', 'ARTICLE_GRID', 'QUOTE_BLOCK', 'CTA_BUTTON', 'SPACER', 'DIVIDER');

-- CreateTable
CREATE TABLE "public"."PageComponent" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "public"."PageComponentType" NOT NULL,
    "content" JSONB NOT NULL,
    "styleVariant" TEXT,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CarouselImage" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "caption" TEXT,
    "order" INTEGER NOT NULL,
    "pageComponentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarouselImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageComponent_serviceId_order_idx" ON "public"."PageComponent"("serviceId", "order");

-- CreateIndex
CREATE INDEX "CarouselImage_pageComponentId_order_idx" ON "public"."CarouselImage"("pageComponentId", "order");

-- AddForeignKey
ALTER TABLE "public"."PageComponent" ADD CONSTRAINT "PageComponent_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CarouselImage" ADD CONSTRAINT "CarouselImage_pageComponentId_fkey" FOREIGN KEY ("pageComponentId") REFERENCES "public"."PageComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
