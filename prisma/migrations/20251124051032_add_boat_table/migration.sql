-- AlterTable
ALTER TABLE "products" ADD COLUMN     "boatId" TEXT;

-- CreateTable
CREATE TABLE "boats" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registration_number" TEXT,
    "boat_type" TEXT,
    "capacity" INTEGER NOT NULL,
    "description" TEXT,
    "image_urls" TEXT[],
    "featured_image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "boats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "boats_registration_number_key" ON "boats"("registration_number");

-- CreateIndex
CREATE INDEX "boats_tenantId_isActive_idx" ON "boats"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "boats_isActive_createdAt_idx" ON "boats"("isActive", "createdAt");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boats" ADD CONSTRAINT "boats_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
