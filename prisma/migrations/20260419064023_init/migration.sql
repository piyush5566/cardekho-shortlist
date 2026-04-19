-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMinLakh" DOUBLE PRECISION NOT NULL,
    "priceMaxLakh" DOUBLE PRECISION NOT NULL,
    "fuelType" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "sunroof" BOOLEAN NOT NULL DEFAULT false,
    "safetyRating" DOUBLE PRECISION,
    "avgRating" DOUBLE PRECISION,
    "reviewSummary" TEXT,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Car_slug_key" ON "Car"("slug");

-- CreateIndex
CREATE INDEX "Car_priceMinLakh_priceMaxLakh_idx" ON "Car"("priceMinLakh", "priceMaxLakh");

-- CreateIndex
CREATE INDEX "Car_segment_idx" ON "Car"("segment");
