-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMinLakh" REAL NOT NULL,
    "priceMaxLakh" REAL NOT NULL,
    "fuelType" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "sunroof" BOOLEAN NOT NULL DEFAULT false,
    "safetyRating" REAL,
    "avgRating" REAL,
    "reviewSummary" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Car_slug_key" ON "Car"("slug");

-- CreateIndex
CREATE INDEX "Car_priceMinLakh_priceMaxLakh_idx" ON "Car"("priceMinLakh", "priceMaxLakh");

-- CreateIndex
CREATE INDEX "Car_segment_idx" ON "Car"("segment");
