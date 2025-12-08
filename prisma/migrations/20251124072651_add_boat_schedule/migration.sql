-- CreateTable
CREATE TABLE "fastboat_schedules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "departureRouteId" TEXT NOT NULL,
    "arrivalRouteId" TEXT NOT NULL,
    "boatId" TEXT,
    "departure_time" TEXT NOT NULL,
    "arrival_time" TEXT,
    "capacity" INTEGER NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "fastboat_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fastboat_schedules_tenantId_departure_time_idx" ON "fastboat_schedules"("tenantId", "departure_time");

-- CreateIndex
CREATE INDEX "fastboat_schedules_productId_departure_time_idx" ON "fastboat_schedules"("productId", "departure_time");

-- CreateIndex
CREATE INDEX "fastboat_schedules_departureRouteId_departure_time_idx" ON "fastboat_schedules"("departureRouteId", "departure_time");

-- CreateIndex
CREATE INDEX "fastboat_schedules_arrivalRouteId_departure_time_idx" ON "fastboat_schedules"("arrivalRouteId", "departure_time");

-- CreateIndex
CREATE INDEX "routes_tenantId_isActive_idx" ON "routes"("tenantId", "isActive");

-- AddForeignKey
ALTER TABLE "fastboat_schedules" ADD CONSTRAINT "fastboat_schedules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fastboat_schedules" ADD CONSTRAINT "fastboat_schedules_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fastboat_schedules" ADD CONSTRAINT "fastboat_schedules_departureRouteId_fkey" FOREIGN KEY ("departureRouteId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fastboat_schedules" ADD CONSTRAINT "fastboat_schedules_arrivalRouteId_fkey" FOREIGN KEY ("arrivalRouteId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fastboat_schedules" ADD CONSTRAINT "fastboat_schedules_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
