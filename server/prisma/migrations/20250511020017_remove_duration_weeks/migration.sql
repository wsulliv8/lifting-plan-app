/*
  Warnings:

  - You are about to drop the column `duration_weeks` on the `Plans` table. All the data in the column will be lost.
  - You are about to drop the column `plan_day` on the `Workouts` table. All the data in the column will be lost.
  - You are about to drop the column `plan_id` on the `Workouts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Workouts" DROP CONSTRAINT "Workouts_plan_id_fkey";

-- AlterTable
ALTER TABLE "Plans" DROP COLUMN "duration_weeks";

-- AlterTable
ALTER TABLE "Workouts" DROP COLUMN "plan_day",
DROP COLUMN "plan_id";
