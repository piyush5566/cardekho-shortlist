-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedCar" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "snapshot" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedCar_sessionId_idx" ON "SavedCar"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedCar_sessionId_carId_key" ON "SavedCar"("sessionId", "carId");

-- AddForeignKey
ALTER TABLE "SavedCar" ADD CONSTRAINT "SavedCar_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCar" ADD CONSTRAINT "SavedCar_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
