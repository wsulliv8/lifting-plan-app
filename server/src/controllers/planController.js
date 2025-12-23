const prisma = require("../../prisma/client");
const { Prisma } = require("@prisma/client");

const planController = {
  async getPlans(req, res, next) {
    try {
      const userId = req.user.userId;

      // 1. Fetch user plans and generic plans with only necessary fields
      const [userPlans, genericPlans] = await Promise.all([
        prisma.plans.findMany({
          where: { user_id: userId },
          select: {
            id: true,
            name: true,
            goal: true,
            duration_weeks: true,
            difficulty: true,
            current_workout_id: true,
            user_id: true,
          },
        }),
        prisma.plans.findMany({
          where: { user_id: null },
          select: {
            id: true,
            name: true,
            goal: true,
            duration_weeks: true,
            difficulty: true,
            current_workout_id: true,
            user_id: true,
          },
        }),
      ]);

      const allPlanIds = [...userPlans, ...genericPlans].map((p) => p.id);

      // 3. Run the fast GroupBy queries (The code you wrote!)
      // NOTE: This assumes 'workouts' table has a 'plan_id' column.
      const [totalCounts, completedCounts] = await Promise.all([
        prisma.workouts.groupBy({
          by: ["plan_id"],
          where: { plan_id: { in: allPlanIds } },
          _count: { id: true },
        }),
        prisma.workouts.groupBy({
          by: ["plan_id"],
          where: {
            plan_id: { in: allPlanIds },
            completed_at: { not: null },
          },
          _count: { id: true },
        }),
      ]);

      // 4. Helper function to merge counts back into plans
      const mergeCounts = (plans) => {
        return plans.map((plan) => {
          // Find the count for this specific plan
          const total =
            totalCounts.find((c) => c.plan_id === plan.id)?._count.id || 0;
          const completed =
            completedCounts.find((c) => c.plan_id === plan.id)?._count.id || 0;

          return {
            ...plan,
            totalWorkouts: total,
            completedWorkouts: completed,
          };
        });
      };

      // 5. Send the optimized response
      res.json({
        userPlans: mergeCounts(userPlans),
        genericPlans: mergeCounts(genericPlans),
      });
    } catch (error) {
      next(error);
    }
  },

  async startPlan(req, res, next) {
    const planId = parseInt(req.params.id);
    try {
      // Only set started_at if it hasn't been set yet
      const existingPlan = await prisma.plans.findUnique({
        where: { id: planId },
        select: { started_at: true },
      });

      const plan = await prisma.plans.update({
        where: { id: planId },
        data: existingPlan.started_at ? {} : { started_at: new Date() },
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
                orderBy: { week_number: "asc" },
                include: {
                  days: {
                    orderBy: { day_of_week: "asc" },
                    include: {
                      workoutDays: {
                        orderBy: { order: "asc" },
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
    const { weeks, ...baseData } = req.body;

    try {
      const updatedPlan = await prisma.$transaction(
        async (tx) => {
          // 1. Update Base Plan
          await tx.plans.update({
            where: { id: planId },
            data: {
              name: baseData.name,
              categories: baseData.categories,
              description: baseData.description,
              duration_weeks: baseData.duration_weeks,
              difficulty: baseData.difficulty,
              goal: baseData.goal,
              dayGroups: baseData.dayGroups,
            },
          });

          // 2a. Clean up orphaned completed workouts from old system (one-time migration)
          // These are completed workouts with no WorkoutDay links (from before Day-Level Protection)
          const orphanedCompleted = await tx.workouts.findMany({
            where: {
              plan_id: planId,
              completed_at: { not: null },
              workoutDays: { none: {} },
            },
            select: { id: true, name: true, completed_at: true },
          });

          // Note: orphanedCompleted are logged for debugging but not reconnected
          // These are from old system before Day-Level Protection was implemented

          // 2b. Build protected set (days with completed workouts)
          const completedDays = await tx.workouts.findMany({
            where: {
              plan_id: planId,
              completed_at: { not: null },
            },
            select: { week_number: true, day_of_week: true },
          });

          const protectedSet = new Set(
            completedDays.map((d) => `${d.week_number}-${d.day_of_week}`)
          );

          // 3. Delete ONLY unprotected days (preserves completed progress)
          await tx.day.deleteMany({
            where: {
              week: { plan_id: planId },
              workoutDays: {
                none: {
                  workout: { completed_at: { not: null } },
                },
              },
            },
          });

          // 4. Rebuild weeks with only unprotected days (parallel + fast)
          await Promise.all(
            weeks.map((week) => {
              const weekNum = parseInt(week.week_number);

              // Filter out protected days
              const safeDays = week.days.filter(
                (day) => !protectedSet.has(`${weekNum}-${day.day_of_week}`)
              );

              if (safeDays.length === 0) return Promise.resolve();

              // Prepare days for creation
              const daysToCreate = safeDays.map((day) => ({
                day_of_week: parseInt(day.day_of_week),
                workoutDays: {
                  create: (day.workouts || []).map((workout, index) => ({
                    order: index,
                    workout: {
                      create: {
                        name: workout.name || `Workout ${index + 1}`,
                        plan_id: planId,
                        user_id: req.user.userId,
                        week_number: weekNum,
                        day_of_week: String(day.day_of_week),
                        plan_day: parseInt(day.day_of_week),
                        lifts: {
                          create: (workout.lifts || []).map((lift) => ({
                            name: lift.name,
                            base_lift_id: lift.base_lift_id,
                            sets: lift.sets,
                            reps: lift.reps.map(String),
                            weight: lift.weight,
                            rpe: lift.rpe?.map(String) || [],
                            rest_time: lift.rest?.map((t) => parseInt(t)) || [],
                            progression_rule: lift.progression_rule,
                          })),
                        },
                      },
                    },
                  })),
                },
              }));

              // Find or create week
              return tx.week
                .findFirst({
                  where: {
                    plan_id: planId,
                    week_number: weekNum,
                  },
                })
                .then(async (existingWeek) => {
                  if (existingWeek) {
                    // Week exists, add days to it
                    return tx.week.update({
                      where: { id: existingWeek.id },
                      data: {
                        days: {
                          create: daysToCreate,
                        },
                      },
                    });
                  } else {
                    // Create new week with days
                    return tx.week.create({
                      data: {
                        plan_id: planId,
                        week_number: weekNum,
                        days: {
                          create: daysToCreate,
                        },
                      },
                    });
                  }
                });
            })
          );

          // 6. Delete orphaned incomplete workouts (no WorkoutDay links)
          await tx.workouts.deleteMany({
            where: {
              plan_id: planId,
              completed_at: null,
              workoutDays: { none: {} }, // No WorkoutDay links
            },
          });

          // 6a. Clean up any orphaned days (no WorkoutDay entries after workout cleanup)
          await tx.day.deleteMany({
            where: {
              week: { plan_id: planId },
              workoutDays: { none: {} }, // No workouts on this day
            },
          });

          // 5c. Clean up any orphaned weeks (no days left after day cleanup)
          await tx.week.deleteMany({
            where: {
              plan_id: planId,
              days: { none: {} },
            },
          });

          // 6. Update the "current_workout_id" to first incomplete workout
          const nextWorkout = await tx.workouts.findFirst({
            where: {
              plan_id: planId,
              completed_at: null,
              workoutDays: { some: {} }, // Must have WorkoutDay link
            },
            orderBy: [{ week_number: "asc" }, { plan_day: "asc" }],
          });

          await tx.plans.update({
            where: { id: planId },
            data: { current_workout_id: nextWorkout?.id || null },
          });

          return { id: planId };
        },
        {
          timeout: 60000, // 30 seconds for large plans with many workouts
        }
      );

      // Final fetch for the frontend
      const completePlan = await prisma.plans.findUnique({
        where: { id: planId },
        include: {
          /* ... your same deep includes ... */
        },
      });

      res.json(completePlan);
    } catch (error) {
      console.error("Update Error:", error);
      next(error);
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
