/*
  Warnings:

  - You are about to drop the column `boat_type` on the `boats` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `boats` table. All the data in the column will be lost.
  - You are about to drop the column `featured_image` on the `boats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "boats" DROP COLUMN "boat_type",
DROP COLUMN "description",
DROP COLUMN "featured_image";
