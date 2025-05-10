-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plans" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" TEXT NOT NULL,
    "categories" TEXT[],
    "description" TEXT,
    "duration_weeks" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Week" (
    "id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "week_number" INTEGER NOT NULL,

    CONSTRAINT "Week_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Day" (
    "id" SERIAL NOT NULL,
    "week_id" INTEGER NOT NULL,
    "day_of_week" INTEGER NOT NULL,

    CONSTRAINT "Day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutDay" (
    "id" SERIAL NOT NULL,
    "day_id" INTEGER NOT NULL,
    "workout_id" INTEGER NOT NULL,
    "order" INTEGER,

    CONSTRAINT "WorkoutDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workouts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "plan_id" INTEGER,
    "name" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "plan_day" INTEGER NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "iteration" INTEGER,
    "total_volume" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaseLifts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "video_url" TEXT,
    "muscle_group" TEXT NOT NULL,
    "lift_type" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BaseLifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLiftsData" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "base_lift_id" INTEGER NOT NULL,
    "max_weights" INTEGER[],
    "rep_ranges" INTEGER[],
    "max_estimated" INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLiftsData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lifts" (
    "id" SERIAL NOT NULL,
    "workout_id" INTEGER NOT NULL,
    "base_lift_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "sets" INTEGER NOT NULL,
    "reps" TEXT[],
    "reps_achieved" INTEGER[],
    "weight" INTEGER[],
    "weight_achieved" INTEGER[],
    "rpe" TEXT[],
    "rpe_achieved" INTEGER[],
    "rest_time" INTEGER[],
    "volume" INTEGER,
    "progression_rule" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupersetLinks" (
    "id" SERIAL NOT NULL,
    "lift_id" INTEGER NOT NULL,
    "superset_lift_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupersetLinks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "BaseLifts_name_key" ON "BaseLifts"("name");

-- AddForeignKey
ALTER TABLE "Plans" ADD CONSTRAINT "Plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Week" ADD CONSTRAINT "Week_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Day" ADD CONSTRAINT "Day_week_id_fkey" FOREIGN KEY ("week_id") REFERENCES "Week"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutDay" ADD CONSTRAINT "WorkoutDay_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "Day"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutDay" ADD CONSTRAINT "WorkoutDay_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "Workouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workouts" ADD CONSTRAINT "Workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workouts" ADD CONSTRAINT "Workouts_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLiftsData" ADD CONSTRAINT "UserLiftsData_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLiftsData" ADD CONSTRAINT "UserLiftsData_base_lift_id_fkey" FOREIGN KEY ("base_lift_id") REFERENCES "BaseLifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lifts" ADD CONSTRAINT "Lifts_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "Workouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lifts" ADD CONSTRAINT "Lifts_base_lift_id_fkey" FOREIGN KEY ("base_lift_id") REFERENCES "BaseLifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupersetLinks" ADD CONSTRAINT "SupersetLinks_lift_id_fkey" FOREIGN KEY ("lift_id") REFERENCES "Lifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupersetLinks" ADD CONSTRAINT "SupersetLinks_superset_lift_id_fkey" FOREIGN KEY ("superset_lift_id") REFERENCES "Lifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
