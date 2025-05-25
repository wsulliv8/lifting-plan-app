-- AlterTable
ALTER TABLE "Plans" ADD COLUMN     "current_workout_id" INTEGER DEFAULT 0,
ADD COLUMN     "source_plan_id" INTEGER;
