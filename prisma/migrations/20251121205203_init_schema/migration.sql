-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('BOAT_ROUTE', 'TOUR_PACKAGE', 'ATTRACTION', 'RENTAL');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'TENANT_FINANCE', 'TENANT_STAFF', 'TENANT_OPERATOR', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('IDR', 'USD');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "owner_name" TEXT,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "business_address" TEXT,
    "npwp_business_id" TEXT,
    "bank_name" TEXT,
    "account_number" TEXT,
    "contract_start_date" TIMESTAMP(3) NOT NULL,
    "contract_end_date" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "total_bookings" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "tenantId" TEXT,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_product_categories" (
    "tenantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT,

    CONSTRAINT "tenant_product_categories_pkey" PRIMARY KEY ("tenantId","categoryId")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "productType" "ProductType" NOT NULL,
    "categoryId" TEXT,
    "route_from" TEXT,
    "route_to" TEXT,
    "departure_time" TEXT,
    "arrival_time" TEXT,
    "location" TEXT,
    "unit_type" TEXT,
    "duration_days" INTEGER,
    "duration_hours" INTEGER,
    "image_urls" TEXT[],
    "featured_image" TEXT,
    "price_idr" DECIMAL(12,2) NOT NULL,
    "price_usd" DECIMAL(10,2) NOT NULL,
    "is_free" BOOLEAN NOT NULL DEFAULT false,
    "total_bookings" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(3,2),
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_itineraries" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "location" TEXT,
    "included_meals" TEXT,
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tour_itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_prices" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price_idr" DECIMAL(12,2) NOT NULL,
    "price_usd" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "inventoryDate" DATE NOT NULL,
    "totalCapacity" INTEGER NOT NULL,
    "bookedUnits" INTEGER NOT NULL DEFAULT 0,
    "availableUnits" INTEGER NOT NULL DEFAULT 0,
    "price_override_idr" DECIMAL(12,2),
    "price_override_usd" DECIMAL(10,2),
    "allow_overbooking" BOOLEAN NOT NULL DEFAULT false,
    "max_overbook_units" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "booking_code" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "status" "BookingStatus" NOT NULL,
    "xendit_invoice_id" TEXT,
    "payment_method" TEXT,
    "xendit_payment_channel" TEXT,
    "paid_amount" DECIMAL(12,2),
    "invoice_expiry_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "xendit_callback_data" JSONB,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT,
    "customer_notes" TEXT,
    "check_in_date" TIMESTAMP(3),
    "check_out_date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by" TEXT,
    "cancellation_reason" TEXT,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_items" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "inventoryId" TEXT,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "item_date" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "participant_name" TEXT,
    "participant_email" TEXT,
    "participant_phone" TEXT,
    "special_requirements" TEXT,
    "is_cancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "service_rating" INTEGER,
    "value_rating" INTEGER,
    "location_rating" INTEGER,
    "score_sentiment" DECIMAL(4,3),
    "sentiment_label" TEXT,
    "key_phrases" TEXT[],
    "review_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "report_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_vendor_name_key" ON "tenants"("vendor_name");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_email_key" ON "tenants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_npwp_business_id_key" ON "tenants"("npwp_business_id");

-- CreateIndex
CREATE INDEX "tenants_isActive_createdAt_idx" ON "tenants"("isActive", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_isActive_idx" ON "users"("email", "isActive");

-- CreateIndex
CREATE INDEX "users_tenantId_role_idx" ON "users"("tenantId", "role");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "categories_isActive_sort_order_idx" ON "categories"("isActive", "sort_order");

-- CreateIndex
CREATE INDEX "tenant_product_categories_categoryId_isActive_idx" ON "tenant_product_categories"("categoryId", "isActive");

-- CreateIndex
CREATE INDEX "products_tenantId_productType_idx" ON "products"("tenantId", "productType");

-- CreateIndex
CREATE INDEX "products_categoryId_isActive_idx" ON "products"("categoryId", "isActive");

-- CreateIndex
CREATE INDEX "products_isActive_is_featured_idx" ON "products"("isActive", "is_featured");

-- CreateIndex
CREATE INDEX "products_average_rating_idx" ON "products"("average_rating");

-- CreateIndex
CREATE INDEX "products_createdAt_idx" ON "products"("createdAt");

-- CreateIndex
CREATE INDEX "tour_itineraries_productId_dayNumber_idx" ON "tour_itineraries"("productId", "dayNumber");

-- CreateIndex
CREATE INDEX "tour_itineraries_productId_sort_order_idx" ON "tour_itineraries"("productId", "sort_order");

-- CreateIndex
CREATE INDEX "product_prices_productId_isActive_idx" ON "product_prices"("productId", "isActive");

-- CreateIndex
CREATE INDEX "product_prices_valid_from_valid_to_idx" ON "product_prices"("valid_from", "valid_to");

-- CreateIndex
CREATE INDEX "inventory_inventoryDate_idx" ON "inventory"("inventoryDate");

-- CreateIndex
CREATE INDEX "inventory_tenantId_productId_idx" ON "inventory"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "inventory_is_available_inventoryDate_idx" ON "inventory"("is_available", "inventoryDate");

-- CreateIndex
CREATE INDEX "inventory_availableUnits_idx" ON "inventory"("availableUnits");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_productId_inventoryDate_key" ON "inventory"("productId", "inventoryDate");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_code_key" ON "bookings"("booking_code");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_xendit_invoice_id_key" ON "bookings"("xendit_invoice_id");

-- CreateIndex
CREATE INDEX "bookings_customerId_status_idx" ON "bookings"("customerId", "status");

-- CreateIndex
CREATE INDEX "bookings_tenantId_bookingDate_idx" ON "bookings"("tenantId", "bookingDate");

-- CreateIndex
CREATE INDEX "bookings_status_createdAt_idx" ON "bookings"("status", "createdAt");

-- CreateIndex
CREATE INDEX "bookings_booking_code_idx" ON "bookings"("booking_code");

-- CreateIndex
CREATE INDEX "bookings_xendit_invoice_id_idx" ON "bookings"("xendit_invoice_id");

-- CreateIndex
CREATE INDEX "bookings_invoice_expiry_date_idx" ON "bookings"("invoice_expiry_date");

-- CreateIndex
CREATE INDEX "booking_items_bookingId_item_date_idx" ON "booking_items"("bookingId", "item_date");

-- CreateIndex
CREATE INDEX "booking_items_productId_item_date_idx" ON "booking_items"("productId", "item_date");

-- CreateIndex
CREATE INDEX "booking_items_inventoryId_idx" ON "booking_items"("inventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_bookingId_key" ON "reviews"("bookingId");

-- CreateIndex
CREATE INDEX "reviews_productId_rating_idx" ON "reviews"("productId", "rating");

-- CreateIndex
CREATE INDEX "reviews_tenantId_review_date_idx" ON "reviews"("tenantId", "review_date");

-- CreateIndex
CREATE INDEX "reviews_score_sentiment_idx" ON "reviews"("score_sentiment");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_product_categories" ADD CONSTRAINT "tenant_product_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_product_categories" ADD CONSTRAINT "tenant_product_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_itineraries" ADD CONSTRAINT "tour_itineraries_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
