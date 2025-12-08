/*
  Warnings:

  - You are about to drop the column `arrival_time` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `boatId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `departure_time` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `duration_days` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `duration_hours` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `route_from` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `route_to` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `unit_type` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `routes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId]` on the table `fastboat_schedules` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `routes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId]` on the table `tour_itineraries` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_boatId_fkey";

-- DropForeignKey
ALTER TABLE "routes" DROP CONSTRAINT "routes_tenantId_fkey";

-- DropIndex
DROP INDEX "fastboat_schedules_productId_departure_time_idx";

-- DropIndex
DROP INDEX "routes_tenantId_isActive_idx";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "arrival_time",
DROP COLUMN "boatId",
DROP COLUMN "departure_time",
DROP COLUMN "duration_days",
DROP COLUMN "duration_hours",
DROP COLUMN "location",
DROP COLUMN "route_from",
DROP COLUMN "route_to",
DROP COLUMN "unit_type";

-- AlterTable
ALTER TABLE "routes" DROP COLUMN "tenantId";

-- CreateIndex
CREATE UNIQUE INDEX "fastboat_schedules_productId_key" ON "fastboat_schedules"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "routes_name_key" ON "routes"("name");

-- CreateIndex
CREATE INDEX "routes_isActive_idx" ON "routes"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "tour_itineraries_productId_key" ON "tour_itineraries"("productId");
