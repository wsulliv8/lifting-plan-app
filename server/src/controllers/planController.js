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
        include: {
          weeks: {
            include: {
              days: {
                include: {
                  workoutDays: {
                    include: {
                      workout: {
                        select: {
                          id: true,
                          completed_at: true,
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

      // Add workout counts to each plan
      const userPlansWithCounts = userPlans.map((plan) => {
        let totalWorkouts = 0;
        let completedWorkouts = 0;

        plan.weeks?.forEach((week) => {
          week.days?.forEach((day) => {
            day.workoutDays?.forEach((workoutDay) => {
              totalWorkouts++;
              if (workoutDay.workout.completed_at) {
                completedWorkouts++;
              }
            });
          });
        });

        // Remove the weeks data since we don't need it in the frontend
        const { weeks, ...planWithoutWeeks } = plan;
        return {
          ...planWithoutWeeks,
          totalWorkouts,
          completedWorkouts,
        };
      });

      const genericPlans = await prisma.plans.findMany({
        where: {
          user_id: null,
        },
        include: {
          weeks: {
            include: {
              days: {
                include: {
                  workoutDays: {
                    include: {
                      workout: {
                        select: {
                          id: true,
                          completed_at: true,
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

      // Add workout counts to each generic plan
      const genericPlansWithCounts = genericPlans.map((plan) => {
        let totalWorkouts = 0;
        let completedWorkouts = 0;

        plan.weeks?.forEach((week) => {
          week.days?.forEach((day) => {
            day.workoutDays?.forEach((workoutDay) => {
              totalWorkouts++;
              if (workoutDay.workout.completed_at) {
                completedWorkouts++;
              }
            });
          });
        });

        // Remove the weeks data since we don't need it in the frontend
        const { weeks, ...planWithoutWeeks } = plan;
        return {
          ...planWithoutWeeks,
          totalWorkouts,
          completedWorkouts,
        };
      });

      res.json({
        userPlans: userPlansWithCounts,
        genericPlans: genericPlansWithCounts,
      });
    } catch (error) {
      next(error);
    }
  },

  async startPlan(req, res, next) {
    const planId = parseInt(req.params.id);
    try {
      const plan = await prisma.plans.update({
        where: { id: planId },
        data: { started_at: new Date() },
        select: { id: true, started_at: true },
      });
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }
      res.json(plan);
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
    const userId = req.user.userId;

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
      if (plan.user_id !== null && plan.user_id !== userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized access to this plan" });
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

      await prisma.workouts.deleteMany({
        where: { plan_id: planId },
      });

      // Delete the plan (cascading deletes handle weeks)
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
    const planId = parseInt(req.params.id);
    const planData = req.body;

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
              ...(planData.dayGroups && { dayGroups: planData.dayGroups }),
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
              weekRecord = await prismaTransaction.week.update({
                where: { id: week.id },
                data: { week_number: weekNumber },
              });
            } else {
              weekRecord = await prismaTransaction.week.create({
                data: {
                  week_number: weekNumber,
                  plan: { connect: { id: planId } },
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
                dayRecord = await prismaTransaction.day.update({
                  where: { id: day.id },
                  data: { day_of_week: dayOfWeek },
                });
              } else {
                dayRecord = await prismaTransaction.day.create({
                  data: {
                    day_of_week: dayOfWeek,
                    week: {
                      connect: { id: weekRecord.id },
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

                // First get all existing workout days for this day
                const existingWorkoutDays =
                  await prismaTransaction.workoutDay.findMany({
                    where: { day_id: dayRecord.id },
                    include: {
                      workout: {
                        include: { lifts: true },
                      },
                    },
                    orderBy: { order: "asc" },
                  });

                for (let index = 0; index < day.workouts.length; index++) {
                  const workout = day.workouts[index];
                  let workoutRecord;
                  let workoutDayRecord;

                  // Try to find an existing workout day at this position
                  const existingWorkoutDay = existingWorkoutDays[index];

                  if (existingWorkoutDay) {
                    // Update existing workout
                    workoutRecord = await prismaTransaction.workouts.update({
                      where: { id: existingWorkoutDay.workout.id },
                      data: {
                        name: workout.name || `Workout ${index + 1}`,
                        week_number: weekNumber,
                        day_of_week: String(dayOfWeek),
                        plan_day: dayOfWeek,
                      },
                    });

                    // Update the workout day order if needed
                    workoutDayRecord =
                      await prismaTransaction.workoutDay.update({
                        where: { id: existingWorkoutDay.id },
                        data: { order: index },
                      });
                  } else {
                    // Create new workout
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

                    // Create new workout day
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

                  // Process lifts
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
                        // Update existing lift
                        liftRecord = await prismaTransaction.lifts.update({
                          where: { id: parseInt(lift.id) },
                          data: {
                            workout: { connect: { id: workoutRecord.id } },
                            name: lift.name,
                            base_lift: { connect: { id: lift.base_lift_id } },
                            sets: lift.sets,
                            reps: lift.reps.map((rep) => String(rep)),
                            weight: lift.weight,
                            rpe: lift.rpe.map((rpe) => String(rpe)),
                            rest_time: lift.rest.map((time) => parseInt(time)),
                            progression_rule: lift.progression_rule,
                          },
                        });
                      } else {
                        // Create new lift
                        liftRecord = await prismaTransaction.lifts.create({
                          data: {
                            workout: { connect: { id: workoutRecord.id } },
                            name: lift.name,
                            base_lift: { connect: { id: lift.base_lift_id } },
                            sets: lift.sets,
                            reps: lift.reps.map((rep) => String(rep)),
                            weight: lift.weight,
                            rpe: lift.rpe.map((rpe) => String(rpe)),
                            rest_time: lift.rest.map((time) => parseInt(time)),
                            progression_rule: lift.progression_rule,
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
          // Find the "first" workout after all inserts
          const firstWorkout = await prismaTransaction.workouts.findFirst({
            where: {
              plan_id: planId,
              user_id: req.user.userId,
            },
            orderBy: [
              { week_number: "asc" },
              { plan_day: "asc" },
              { id: "asc" }, // fallback
            ],
          });

          if (firstWorkout) {
            await prismaTransaction.plans.update({
              where: { id: planId },
              data: {
                current_workout_id: firstWorkout.id,
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

  async copyPlan(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      // Get the original plan with all related data
      const originalPlan = await prisma.plans.findUnique({
        where: { id: parseInt(id) },
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

      if (!originalPlan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      // Destructure the original plan, omitting fields we don't want to copy
      const {
        id: _id,
        user_id: _userId,
        created_at: _created,
        started_at: _started,
        completed_at: _completed,
        current_workout_id: _current,
        weeks,
        ...planBase
      } = originalPlan;

      // Create a new plan with the user's ID
      const newPlan = await prisma.plans.create({
        data: {
          ...planBase,
          user_id: userId,
          source_plan_id: parseInt(id),
          name: `${planBase.name} (Copy)`,
          weeks: {
            create: weeks.map(
              ({ id: _weekId, plan_id: _planId, days, ...week }) => ({
                ...week,
                days: {
                  create: days.map(
                    ({
                      id: _dayId,
                      week_id: _weekId,
                      workoutDays,
                      ...day
                    }) => ({
                      ...day,
                      workoutDays: {
                        create: workoutDays.map(
                          ({
                            id: _wdId,
                            day_id: _dayId,
                            workout_id: _workoutId,
                            workout,
                            ...wd
                          }) => {
                            const {
                              id: _wid,
                              created_at: _wcreated,
                              plan_id: _wplanId,
                              user_id: _wuserId,
                              ...workoutData
                            } = workout;

                            return {
                              ...wd,
                              workout: {
                                create: {
                                  ...workoutData,
                                  user_id: userId, // Set the user_id for the workout
                                  lifts: {
                                    create: workout.lifts.map(
                                      ({
                                        id: _liftId,
                                        workout_id: _wid,
                                        created_at: _lcreated,
                                        completed,
                                        ...lift
                                      }) => ({
                                        ...lift,
                                        completed: false,
                                      })
                                    ),
                                  },
                                },
                              },
                            };
                          }
                        ),
                      },
                    })
                  ),
                },
              })
            ),
          },
        },
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

      // Update all workouts to set their plan_id
      await Promise.all(
        newPlan.weeks.flatMap((week) =>
          week.days.flatMap((day) =>
            day.workoutDays.map(async (workoutDay) => {
              await prisma.workouts.update({
                where: { id: workoutDay.workout.id },
                data: { plan_id: newPlan.id },
              });
            })
          )
        )
      );

      // Find the first workout for this plan and set it as current_workout_id
      const firstWorkout = await prisma.workouts.findFirst({
        where: {
          plan_id: newPlan.id,
          user_id: userId,
        },
        orderBy: [
          { week_number: "asc" },
          { plan_day: "asc" },
          { id: "asc" }, // fallback
        ],
      });

      if (firstWorkout) {
        await prisma.plans.update({
          where: { id: newPlan.id },
          data: {
            current_workout_id: firstWorkout.id,
          },
        });
      }

      // Fetch the updated plan with all relationships
      const updatedPlan = await prisma.plans.findUnique({
        where: { id: newPlan.id },
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

      res.json(updatedPlan);
    } catch (error) {
      console.error("Failed to copy plan:", error);
      res.status(500).json({ error: "Failed to copy plan" });
    }
  },
};

module.exports = planController;
