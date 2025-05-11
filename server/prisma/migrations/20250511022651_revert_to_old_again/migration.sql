/*
  Warnings:

  - Added the required column `duration_weeks` to the `Plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan_day` to the `Workouts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Plans" ADD COLUMN     "duration_weeks" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Workouts" ADD COLUMN     "plan_day" INTEGER NOT NULL,
ADD COLUMN     "plan_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Workouts" ADD CONSTRAINT "Workouts_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
