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
        // Create the plan
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
            // Create weeks and their relationships
            weeks: {
              create: plan.weeks.map((week) => ({
                week_number: week.week_number,
                // Create days and their relationships
                days: {
                  create: week.days.map((day) => ({
                    day_of_week: day.day_of_week,
                    // Create workoutDays and their relationships
                    workoutDays: {
                      create: day.workoutDays.map((workoutDay) => ({
                        order: workoutDay.order,
                        // Create workout and its relationships
                        workout: {
                          create: {
                            name: workoutDay.workout.name,
                            week_number: workoutDay.workout.week_number,
                            plan_day: workoutDay.workout.plan_day,
                            day_of_week: workoutDay.workout.day_of_week,
                            iteration: workoutDay.workout.iteration,
                            user_id: null,
                            created_at:
                              workoutDay.workout.created_at || new Date(),
                            // Create lifts
                            lifts: {
                              create: workoutDay.workout.lifts.map((lift) => ({
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
                              })),
                            },
                          },
                        },
                      })),
                    },
                  })),
                },
              })),
            },
          },
          // Include all relationships in the response
          include: {
            weeks: {
              include: {
                days: {
                  include: {
                    workoutDays: {
                      include: {
                        workout: {
                          include: {
                            lifts: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

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
