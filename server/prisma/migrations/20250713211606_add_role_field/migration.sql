/*
  Warnings:

  - You are about to drop the column `set_counts` on the `UserLiftsData` table. All the data in the column will be lost.
  - You are about to drop the column `week_starts` on the `UserLiftsData` table. All the data in the column will be lost.
  - You are about to drop the column `weekly_reps` on the `UserLiftsData` table. All the data in the column will be lost.
  - You are about to drop the column `weekly_volume` on the `UserLiftsData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserLiftsData" DROP COLUMN "set_counts",
DROP COLUMN "week_starts",
DROP COLUMN "weekly_reps",
DROP COLUMN "weekly_volume";

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';
