/*
  Warnings:

  - You are about to drop the column `max_estimated` on the `UserLiftsData` table. All the data in the column will be lost.
  - You are about to drop the column `max_weights` on the `UserLiftsData` table. All the data in the column will be lost.
  - You are about to drop the column `rep_ranges` on the `UserLiftsData` table. All the data in the column will be lost.
  - Added the required column `rep_range_progress` to the `UserLiftsData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserLiftsData" DROP COLUMN "max_estimated",
DROP COLUMN "max_weights",
DROP COLUMN "rep_ranges",
ADD COLUMN     "rep_range_progress" JSONB NOT NULL;
