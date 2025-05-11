const { PrismaClient } = require("@prisma/client");
const { Prisma } = require("@prisma/client");

const prisma = new PrismaClient();

const planController = {
  async getPlans(req, res, next) {
    try {
      const userPlans = await prisma.plans.findMany({
        where: {
          user_id: req.user.userId,
        },
      });
      const genericPlans = await prisma.plans.findMany({
        where: {
          user_id: null,
        },
      });
      res.json({ userPlans, genericPlans });
    } catch (error) {
      next(error);
    }
  },

  async createPlan(req, res, next) {
    try {
      const { name, duration_weeks } = req.body;

      const duration = duration_weeks ? duration_weeks : 3;

      const plan = await prisma.plans.create({
        data: {
          name: name ? name : "New Plan",
          user_id: req.user.userId,
          categories: [],
          description: null,
          duration_weeks: duration,
          difficulty: "Beginner",
          goal: "Strength",
          created_at: new Date(),
          weeks: {
            create: Array.from({ length: duration }, (_, index) => ({
              week_number: index + 1,
              days: {
                create: Array(7)
                  .fill()
                  .map((_, dayIndex) => ({
                    day_of_week: dayIndex,
                    // We cannot directly create workoutDays here because we don't have workout IDs yet
                  })),
              },
            })),
          },
        },
        include: {
          weeks: {
            include: {
              days: true,
            },
          },
        },
      });

      res.status(201).json(plan);
    } catch (error) {
      next(error);
    }
  },

  async getPlanById(req, res, next) {
    const planId = parseInt(req.params.id);
    const { include } = req.query;

    try {
      const plan = await prisma.plans.findUnique({
        where: { id: parseInt(planId) },
        include: include
          ? {
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
            }
          : {},
      });

      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }
      res.json(plan);
    } catch (error) {
      next(error);
    }
  },

  async deletePlan(req, res, next) {
    try {
      const planId = parseInt(req.params.id, 10);

      const plan = await prisma.plans.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      // Check permissions
      if (plan.user_id && plan.user_id !== req.user?.userId) {
        return res
          .status(403)
          .json({ error: "You are not authorized to delete this plan" });
      }
      // Allow deletion of generic plans (user_id: null) only by admins (if applicable)
      if (!plan.user_id && !req.user?.isAdmin) {
        return res
          .status(403)
          .json({ error: "Only admins can delete generic plans" });
      }

      // Delete the plan (cascading deletes handle weeks and workouts)
      await prisma.plans.delete({
        where: { id: planId },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting plan:", error);
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Plan not found" });
      }
      next(error);
    }
  },

  async updatePlan(req, res, next) {
    const { id } = req.params;
    const planData = req.body;

    // Validate and parse id from req.params
    const planId = parseInt(id);
    if (isNaN(planId)) {
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    try {
      // Use a transaction to ensure all updates succeed or fail together
      const updatedPlan = await prisma.$transaction(
        async (prismaTransaction) => {
          // 1. First, update the base plan details
          const basePlanUpdate = await prismaTransaction.plans.update({
            where: { id: planId },
            data: {
              name: planData.name,
              // Only update these fields if they're present in the request
              ...(planData.categories && { categories: planData.categories }),
              ...(planData.description && {
                description: planData.description,
              }),
              ...(planData.duration_weeks && {
                duration_weeks: planData.duration_weeks,
              }),
              ...(planData.difficulty && { difficulty: planData.difficulty }),
              ...(planData.goal && { goal: planData.goal }),
            },
          });

          // Keep track of all week IDs to prevent deletion
          const weekIdsToKeep = [];

          // 2. Process each week
          for (const week of planData.weeks) {
            // Ensure week_number is a number
            const weekNumber = parseInt(week.week_number);

            // Create or update week
            let weekRecord;
            if (week.id) {
              const weekId = parseInt(week.id);
              // Check if ID is within safe integer range for INT4
              if (
                isNaN(weekId) ||
                weekId > 2147483647 ||
                weekId < -2147483648
              ) {
                // If out of range, create new week
                console.warn(
                  `Week ID ${week.id} out of range for INT4, creating new week instead`
                );
                weekRecord = await prismaTransaction.week.create({
                  data: {
                    week_number: weekNumber,
                    plan_id: planId,
                  },
                });
              } else {
                weekRecord = await prismaTransaction.week.update({
                  where: { id: weekId },
                  data: { week_number: weekNumber },
                });
              }
            } else {
              weekRecord = await prismaTransaction.week.create({
                data: {
                  week_number: weekNumber,
                  plan_id: planId,
                },
              });
            }

            // Add this week ID to our tracking array
            weekIdsToKeep.push(weekRecord.id);

            // 3. Process each day in the week
            // Keep track of day IDs to prevent deletion
            const dayIdsToKeep = [];

            for (const day of week.days) {
              // Ensure day_of_week is a number
              const dayOfWeek = parseInt(day.day_of_week);

              // Create or update day
              let dayRecord;
              if (day.id) {
                const dayId = parseInt(day.id);
                // Check if ID is within safe integer range for INT4
                if (isNaN(dayId) || dayId > 2147483647 || dayId < -2147483648) {
                  // If out of range, create new day
                  console.warn(
                    `Day ID ${day.id} out of range for INT4, creating new day instead`
                  );
                  dayRecord = await prismaTransaction.day.create({
                    data: {
                      day_of_week: dayOfWeek,
                      week_id: weekRecord.id,
                      week: {
                        connect: { id: weekRecord.id }, // Use connect to establish the relationship
                      },
                    },
                  });
                } else {
                  dayRecord = await prismaTransaction.day.update({
                    where: { id: dayId },
                    data: { day_of_week: dayOfWeek },
                  });
                }
              } else {
                dayRecord = await prismaTransaction.day.create({
                  data: {
                    day_of_week: dayOfWeek,
                    week: {
                      connect: { id: weekRecord.id }, // Use connect to establish the relationship
                    },
                  },
                });
              }

              // Add this day ID to our tracking array
              dayIdsToKeep.push(dayRecord.id);

              // 4. Process workouts for this day
              if (day.workouts && day.workouts.length > 0) {
                // Keep track of processed workout IDs to delete removed ones later
                const processedWorkoutDayIds = [];

                for (let index = 0; index < day.workouts.length; index++) {
                  const workout = day.workouts[index];

                  // Create or update workout
                  let workoutRecord;
                  if (workout.id) {
                    // Check if the ID is within safe integer range for INT4
                    const workoutId = parseInt(workout.id);
                    if (
                      isNaN(workoutId) ||
                      workoutId > 2147483647 ||
                      workoutId < -2147483648
                    ) {
                      // If out of range, treat as a new workout instead of trying to update
                      console.warn(
                        `Workout ID ${workout.id} out of range for INT4, creating new workout instead`
                      );
                      workoutRecord = await prismaTransaction.workouts.create({
                        data: {
                          name: workout.name || `Workout ${index + 1}`,
                          plan_id: planId,
                          user_id: req.user.userId,
                          week_number: weekNumber,
                          day_of_week: String(dayOfWeek),
                          plan_day: dayOfWeek,
                        },
                      });
                    } else {
                      // If ID is in valid range, proceed with update
                      workoutRecord = await prismaTransaction.workouts.update({
                        where: { id: workoutId },
                        data: {
                          name: workout.name || `Workout ${index + 1}`,
                          week_number: weekNumber,
                          day_of_week: String(dayOfWeek),
                          plan_day: dayOfWeek,
                        },
                      });
                    }
                  } else {
                    workoutRecord = await prismaTransaction.workouts.create({
                      data: {
                        name: workout.name || `Workout ${index + 1}`,
                        plan_id: planId,
                        user_id: req.user.userId,
                        week_number: weekNumber,
                        day_of_week: String(dayOfWeek),
                        plan_day: dayOfWeek,
                      },
                    });
                  }

                  // Create or update workout day connection
                  let workoutDayRecord;
                  if (workout.workoutDayId) {
                    const workoutDayId = parseInt(workout.workoutDayId);
                    // Check if ID is within safe integer range for INT4
                    if (
                      isNaN(workoutDayId) ||
                      workoutDayId > 2147483647 ||
                      workoutDayId < -2147483648
                    ) {
                      // If out of range, create new workout day
                      console.warn(
                        `WorkoutDay ID ${workout.workoutDayId} out of range for INT4, creating new one instead`
                      );
                      workoutDayRecord =
                        await prismaTransaction.workoutDay.create({
                          data: {
                            order: index,
                            day_id: dayRecord.id,
                            workout_id: workoutRecord.id,
                          },
                        });
                    } else {
                      workoutDayRecord =
                        await prismaTransaction.workoutDay.update({
                          where: { id: workoutDayId },
                          data: {
                            order: index,
                            workout_id: workoutRecord.id,
                          },
                        });
                    }
                  } else {
                    workoutDayRecord =
                      await prismaTransaction.workoutDay.create({
                        data: {
                          order: index,
                          day_id: dayRecord.id,
                          workout_id: workoutRecord.id,
                        },
                      });
                  }

                  processedWorkoutDayIds.push(workoutDayRecord.id);

                  // 5. Process lifts if they exist in the request
                  if (workout.lifts && workout.lifts.length > 0) {
                    const processedLiftIds = [];

                    for (
                      let liftIndex = 0;
                      liftIndex < workout.lifts.length;
                      liftIndex++
                    ) {
                      const lift = workout.lifts[liftIndex];

                      let liftRecord;
                      if (lift.id) {
                        const liftId = parseInt(lift.id);
                        if (
                          isNaN(liftId) ||
                          liftId > 2147483647 ||
                          liftId < -2147483648
                        ) {
                          console.warn(
                            `Lift ID ${lift.id} out of range for INT4, creating new lift instead`
                          );
                          liftRecord = await prismaTransaction.lifts.create({
                            data: {
                              id: lift.id,
                              workout_id: workoutRecord.id,
                              name: lift.name,
                              base_lift_id: lift.base_lift_id,
                              sets: lift.sets,
                              reps: lift.reps,
                              weight: lift.weight,
                              rpe: lift.rpe,
                            },
                          });
                        } else {
                          liftRecord = await prismaTransaction.lifts.update({
                            where: { id: liftId },
                            data: {
                              workout_id: workoutRecord.id,
                              name: lift.name,
                              base_lift_id: lift.base_lift_id,
                              sets: lift.sets,
                              reps: lift.reps,
                              weight: lift.weight,
                              rpe: lift.rpe,
                            },
                          });
                        }
                      } else {
                        liftRecord = await prismaTransaction.lifts.create({
                          data: {
                            //id: lift.id,
                            workout_id: workoutRecord.id,
                            name: lift.name,
                            base_lift_id: lift.base_lift_id,
                            sets: lift.sets,
                            reps: lift.reps,
                            weight: lift.weight,
                            rpe: lift.rpe,
                          },
                        });
                      }

                      processedLiftIds.push(liftRecord.id);
                    }

                    // Delete lifts that are no longer in the request
                    await prismaTransaction.lifts.deleteMany({
                      where: {
                        workout_id: workoutRecord.id,
                        id: { notIn: processedLiftIds },
                      },
                    });
                  } else {
                    // If no lifts provided, delete all lifts for this workout
                    await prismaTransaction.lifts.deleteMany({
                      where: {
                        workout_id: workoutRecord.id,
                      },
                    });
                  }
                }

                // Delete any workout days that were removed
                if (processedWorkoutDayIds.length > 0) {
                  await prismaTransaction.workoutDay.deleteMany({
                    where: {
                      day_id: dayRecord.id,
                      id: { notIn: processedWorkoutDayIds },
                    },
                  });
                }
              } else {
                // If no workouts for this day, delete all workout days for this day
                await prismaTransaction.workoutDay.deleteMany({
                  where: { day_id: dayRecord.id },
                });
              }
            }

            // Delete days that were removed from this week
            if (dayIdsToKeep.length > 0) {
              // Find all days to delete
              const daysToDelete = await prismaTransaction.day.findMany({
                where: {
                  week_id: weekRecord.id,
                  id: { notIn: dayIdsToKeep },
                },
                include: { workoutDays: true },
              });

              // For each day to delete, first delete its workout days
              for (const day of daysToDelete) {
                if (day.workoutDays.length > 0) {
                  await prismaTransaction.workoutDay.deleteMany({
                    where: { day_id: day.id },
                  });
                }
              }

              // Now it's safe to delete the days
              await prismaTransaction.day.deleteMany({
                where: {
                  week_id: weekRecord.id,
                  id: { notIn: dayIdsToKeep },
                },
              });
            }
          }

          // Handle week deletion - delete weeks that were removed
          if (weekIdsToKeep.length > 0) {
            // Find weeks to delete and their related days
            const weeksToDelete = await prismaTransaction.week.findMany({
              where: {
                plan_id: planId,
                id: { notIn: weekIdsToKeep },
              },
              include: {
                days: {
                  include: { workoutDays: true },
                },
              },
            });

            // For each week to delete, first delete workout days, then days
            for (const week of weeksToDelete) {
              for (const day of week.days) {
                if (day.workoutDays.length > 0) {
                  await prismaTransaction.workoutDay.deleteMany({
                    where: { day_id: day.id },
                  });
                }
              }

              // Delete all days for this week
              await prismaTransaction.day.deleteMany({
                where: { week_id: week.id },
              });
            }

            // Now safe to delete weeks
            await prismaTransaction.week.deleteMany({
              where: {
                plan_id: planId,
                id: { notIn: weekIdsToKeep },
              },
            });
          }

          // Return success
          return { id: planId };
        }
      );

      // After successful transaction, fetch the complete updated plan
      const completePlan = await prisma.plans.findUnique({
        where: { id: planId },
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

      res.json(completePlan);
    } catch (error) {
      console.error("Error updating plan:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2003") {
          return res.status(400).json({
            error: `Foreign key constraint violation: ${
              error.meta?.field_name || "unknown field"
            }`,
          });
        }
        if (error.code === "P2025") {
          return res.status(404).json({ error: "Plan not found" });
        }
      }
      res.status(500).json({ error: "Failed to update plan" });
    }
  },
};

module.exports = planController;
