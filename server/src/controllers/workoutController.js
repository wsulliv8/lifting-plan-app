const { PrismaClient } = require("@prisma/client");
const progressionAlgorithm = require("../utils/progressionAlgorithm");

const prisma = new PrismaClient();

const workoutController = {
  async getWorkouts(req, res, next) {
    try {
      const { plan_id } = req.query;
      if (!plan_id) {
        return res.status(400).json({ error: "plan_id is required" });
      }

      const workouts = await prisma.workouts.findMany({
        where: {
          plan_id: parseInt(plan_id),
          OR: [{ user_id: req.user.userId }, { user_id: null }],
        },
        include: { lifts: true },
      });

      res.json(workouts);
    } catch (error) {
      next(error);
    }
  },

  async getWorkoutById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const workout = await prisma.workouts.findUnique({
        where: {
          id: parseInt(id),
        },
        include: {
          lifts: true,
          workoutDays: {
            include: {
              day: true,
            },
          },
          plan: true,
        },
      });

      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }

      if (workout.user_id !== null && workout.user_id !== userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized access to this workout" });
      }

      return res.json(workout);
    } catch (error) {
      console.error("Failed to get workout:", error);
      next(error);
    }
  },

  async completeWorkout(req, res, next) {
    try {
      const workoutId = parseInt(req.params.id);
      const { lifts: updatedLifts } = req.body;

      const workout = await prisma.workouts.findUnique({
        where: { id: workoutId },
        include: {
          lifts: { include: { base_lift: true } },
          plan: {
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
          },
        },
      });

      if (!workout) {
        throw new Error("Workout not found", { cause: { status: 404 } });
      }

      // Update all lifts first
      for (const updatedLift of updatedLifts) {
        await prisma.lifts.update({
          where: { id: updatedLift.id },
          data: {
            completed: updatedLift.completed,
            reps_achieved: updatedLift.reps_achieved.map((lift) =>
              parseInt(lift)
            ),
            weight_achieved: updatedLift.weight_achieved.map((lift) =>
              parseFloat(lift)
            ),
            rpe_achieved: updatedLift.rpe_achieved.map((lift) =>
              parseInt(lift)
            ),
            volume: updatedLift.volume,
            notes: updatedLift.notes,
          },
        });
      }

      // Refresh workout data after updates
      const refreshedWorkout = await prisma.workouts.findUnique({
        where: { id: workoutId },
        include: {
          lifts: { include: { base_lift: true } },
          plan: {
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
          },
        },
      });

      // Calculate workout success based on lift performance
      let workoutSuccess = true; // Assume success unless we find failed lifts

      // Process progression for completed lifts using refreshed data
      for (const lift of refreshedWorkout.lifts) {
        if (lift.completed && lift.progression_rule) {
          // Calculate weight adjustment
          const weightAdjustment =
            progressionAlgorithm.adjustFutureWeights(lift);

          // Check if this lift failed (negative adjustment = failed)
          if (weightAdjustment < 0) {
            workoutSuccess = false;
          }

          // If there's an adjustment needed, update future lifts in the plan
          if (weightAdjustment !== 0 && refreshedWorkout.plan) {
            // Get all future workouts in the plan
            const futureWorkouts = refreshedWorkout.plan.weeks
              .flatMap((week) =>
                week.days.flatMap((day) =>
                  day.workoutDays.map((wd) => wd.workout)
                )
              )
              .filter(
                (w) =>
                  w.week_number > refreshedWorkout.week_number ||
                  (w.week_number === refreshedWorkout.week_number &&
                    parseInt(w.day_of_week) >
                      parseInt(refreshedWorkout.day_of_week))
              );

            // Update weights in future lifts of the same type
            for (const futureWorkout of futureWorkouts) {
              const futureLift = futureWorkout.lifts.find(
                (l) => l.base_lift_id === lift.base_lift_id
              );

              if (futureLift) {
                await prisma.lifts.update({
                  where: { id: futureLift.id },
                  data: {
                    weight: futureLift.weight.map((w) =>
                      Math.max(0, Number((w + weightAdjustment).toFixed(1)))
                    ),
                  },
                });
              }
            }
          }

          let userLiftData = await prisma.userLiftsData.findFirst({
            where: {
              user_id: req.user.userId,
              base_lift_id: lift.base_lift_id,
            },
          });

          if (!userLiftData) {
            // For new users, initialize with all sets from first workout
            const maxWeights = [];
            const repRanges = [];
            const maxEstimated = [];

            // Process each set
            for (let i = 0; i < lift.weight.length; i++) {
              const weight = lift.weight[i];
              const reps = parseInt(lift.reps[i].split("-")[0]);
              maxWeights.push(weight);
              repRanges.push(reps);
              maxEstimated.push(Math.round(weight * (1 + reps / 30)));
            }

            await prisma.userLiftsData.create({
              data: {
                user_id: req.user.userId,
                base_lift_id: lift.base_lift_id,
                max_weights: maxWeights,
                rep_ranges: repRanges,
                max_estimated: maxEstimated,
              },
            });
          } else {
            const updatedMaxWeights = [...userLiftData.max_weights];
            const updatedMaxEstimated = [...userLiftData.max_estimated];
            const updatedRepRanges = [...userLiftData.rep_ranges];

            // Process each set in the current lift
            for (let i = 0; i < lift.weight.length; i++) {
              const weight = lift.weight[i];
              const reps = parseInt(lift.reps[i].split("-")[0]);

              // Find if we already have this rep range
              const index = updatedRepRanges.indexOf(reps);

              if (index >= 0) {
                // Update existing rep range if new weight is higher
                if (weight > updatedMaxWeights[index]) {
                  updatedMaxWeights[index] = weight;
                  updatedMaxEstimated[index] = Math.round(
                    weight * (1 + reps / 30)
                  );
                }
              } else {
                // Add new rep range
                updatedMaxWeights.push(weight);
                updatedRepRanges.push(reps);
                updatedMaxEstimated.push(Math.round(weight * (1 + reps / 30)));
              }
            }

            await prisma.userLiftsData.update({
              where: { id: userLiftData.id },
              data: {
                max_weights: updatedMaxWeights,
                rep_ranges: updatedRepRanges,
                max_estimated: updatedMaxEstimated,
              },
            });
          }
        }
      }

      // Update workout with success status and completion time
      await prisma.workouts.update({
        where: { id: workoutId },
        data: {
          success: workoutSuccess,
          completed_at: new Date(),
        },
      });

      // Find the next workout in the plan
      if (refreshedWorkout.plan) {
        const allWorkouts = refreshedWorkout.plan.weeks
          .flatMap((week) =>
            week.days.flatMap((day) =>
              day.workoutDays.map((wd) => ({
                ...wd.workout,
                week_number: week.week_number,
                day_of_week: day.day_of_week,
              }))
            )
          )
          .sort((a, b) => {
            if (a.week_number !== b.week_number) {
              return a.week_number - b.week_number;
            }
            return parseInt(a.day_of_week) - parseInt(b.day_of_week);
          });

        const currentIndex = allWorkouts.findIndex((w) => w.id === workoutId);
        const nextWorkout = allWorkouts[currentIndex + 1];

        // Update the plan's current_workout_id
        await prisma.plans.update({
          where: { id: refreshedWorkout.plan.id },
          data: {
            current_workout_id: nextWorkout ? nextWorkout.id : null,
          },
        });
      }

      res.json({ message: "Workout completed", workoutId });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = workoutController;
