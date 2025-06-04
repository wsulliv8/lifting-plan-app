// server/src/utils/restorePlans.js
const { PrismaClient } = require("@prisma/client");
const fs = require("fs").promises;

const prisma = new PrismaClient();

async function restoreGenericPlans() {
  try {
    // Read the backup file
    const data = await fs.readFile(
      "prisma/data/backup_generic_plans.json",
      "utf8"
    );
    const plans = JSON.parse(data);

    // Delete existing generic plans first
    await prisma.plans.deleteMany({
      where: { user_id: null },
    });

    // Restore each plan
    for (const plan of plans) {
      try {
        // Create the plan first
        const createdPlan = await prisma.plans.create({
          data: {
            name: plan.name,
            categories: plan.categories || [],
            description: plan.description,
            duration_weeks: plan.duration_weeks,
            difficulty: plan.difficulty,
            goal: plan.goal,
            dayGroups: plan.dayGroups || "[]",
            user_id: null,
            created_at: plan.created_at || new Date(),
          },
        });

        // Create weeks for the plan
        for (const week of plan.weeks) {
          const createdWeek = await prisma.week.create({
            data: {
              week_number: week.week_number,
              plan_id: createdPlan.id,
            },
          });

          // Create days for each week
          for (const day of week.days) {
            const createdDay = await prisma.day.create({
              data: {
                day_of_week: day.day_of_week,
                week_id: createdWeek.id,
              },
            });

            // Create workouts first
            for (const workoutDay of day.workoutDays) {
              const workout = workoutDay.workout;

              // Create the workout with plan_id
              const createdWorkout = await prisma.workouts.create({
                data: {
                  name: workout.name,
                  week_number: workout.week_number,
                  plan_day: workout.plan_day,
                  day_of_week: workout.day_of_week,
                  iteration: workout.iteration,
                  user_id: null,
                  created_at: workout.created_at || new Date(),
                  plan_id: createdPlan.id,
                },
              });

              // Create lifts for the workout
              for (const lift of workout.lifts) {
                await prisma.lifts.create({
                  data: {
                    workout_id: createdWorkout.id,
                    name: lift.name,
                    sets: lift.sets,
                    reps: lift.reps,
                    weight: lift.weight,
                    rpe: lift.rpe,
                    rest_time: lift.rest_time,
                    progression_rule: lift.progression_rule,
                    created_at: lift.created_at || new Date(),
                    base_lift_id: lift.base_lift_id,
                    completed: lift.completed || false,
                    reps_achieved: lift.reps_achieved || [],
                    weight_achieved: lift.weight_achieved || [],
                    rpe_achieved: lift.rpe_achieved || [],
                    volume: lift.volume || 0,
                  },
                });
              }

              // Create workoutDay to link the workout to the day
              await prisma.workoutDay.create({
                data: {
                  day_id: createdDay.id,
                  workout_id: createdWorkout.id,
                  order: workoutDay.order,
                },
              });
            }
          }
        }

        // Find the first workout for this plan and set it as current_workout_id
        const firstWorkout = await prisma.workouts.findFirst({
          where: {
            plan_id: createdPlan.id,
            user_id: null,
          },
          orderBy: [
            { week_number: "asc" },
            { plan_day: "asc" },
            { id: "asc" }, // fallback
          ],
        });

        if (firstWorkout) {
          await prisma.plans.update({
            where: { id: createdPlan.id },
            data: {
              current_workout_id: firstWorkout.id,
            },
          });
        }

        console.log(`Successfully restored plan ${plan.name}`);
      } catch (error) {
        console.error(`Error restoring plan ${plan.name}:`, error);
      }
    }

    console.log("Restore completed successfully");
  } catch (error) {
    console.error("Restore failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// If this file is run directly (not imported as a module)
if (require.main === module) {
  console.log("Starting restore of generic plans...");
  restoreGenericPlans()
    .then(() => {
      console.log("Restore process completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Restore process failed:", error);
      process.exit(1);
    });
}

module.exports = { restoreGenericPlans };
