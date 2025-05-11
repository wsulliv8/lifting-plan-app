-- DropForeignKey
ALTER TABLE "Day" DROP CONSTRAINT "Day_week_id_fkey";

-- DropForeignKey
ALTER TABLE "Lifts" DROP CONSTRAINT "Lifts_base_lift_id_fkey";

-- DropForeignKey
ALTER TABLE "Lifts" DROP CONSTRAINT "Lifts_workout_id_fkey";

-- DropForeignKey
ALTER TABLE "SupersetLinks" DROP CONSTRAINT "SupersetLinks_lift_id_fkey";

-- DropForeignKey
ALTER TABLE "SupersetLinks" DROP CONSTRAINT "SupersetLinks_superset_lift_id_fkey";

-- DropForeignKey
ALTER TABLE "Week" DROP CONSTRAINT "Week_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutDay" DROP CONSTRAINT "WorkoutDay_day_id_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutDay" DROP CONSTRAINT "WorkoutDay_workout_id_fkey";

-- AddForeignKey
ALTER TABLE "Week" ADD CONSTRAINT "Week_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Day" ADD CONSTRAINT "Day_week_id_fkey" FOREIGN KEY ("week_id") REFERENCES "Week"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutDay" ADD CONSTRAINT "WorkoutDay_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "Day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutDay" ADD CONSTRAINT "WorkoutDay_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "Workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lifts" ADD CONSTRAINT "Lifts_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "Workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lifts" ADD CONSTRAINT "Lifts_base_lift_id_fkey" FOREIGN KEY ("base_lift_id") REFERENCES "BaseLifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupersetLinks" ADD CONSTRAINT "SupersetLinks_lift_id_fkey" FOREIGN KEY ("lift_id") REFERENCES "Lifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupersetLinks" ADD CONSTRAINT "SupersetLinks_superset_lift_id_fkey" FOREIGN KEY ("superset_lift_id") REFERENCES "Lifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
