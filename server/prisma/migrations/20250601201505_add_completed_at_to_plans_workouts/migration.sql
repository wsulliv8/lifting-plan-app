-- AlterTable
ALTER TABLE "Plans" ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "started_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Workouts" ADD COLUMN     "completed_at" TIMESTAMP(3);
