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
      console.log("workoutId", workoutId);
      const { lifts: updatedLifts } = req.body;
      console.log(
        "Received lifts:",
        updatedLifts.map((l) => ({
          name: l.name,
          completed: l.completed,
        }))
      );

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

      // Process progression for completed lifts using refreshed data
      for (const lift of refreshedWorkout.lifts) {
        console.log("Processing lift:", {
          name: lift.name,
          completed: lift.completed,
          progression_rule: lift.progression_rule,
        });

        if (lift.completed && lift.progression_rule) {
          // Prepare actual performance data
          const actualPerformance = {
            actualWeight: lift.weight_achieved,
            actualReps: lift.reps_achieved,
            actualRPE: lift.rpe_achieved,
          };

          // Calculate weight adjustment using the existing function
          const weightAdjustment = progressionAlgorithm.adjustFutureWeights({
            ...lift,
            actualPerformance,
          });
          console.log("weightAdjustment", weightAdjustment);

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

          // Update user lift data as before
          let userLiftData = await prisma.userLiftsData.findFirst({
            where: {
              user_id: req.user.userId,
              base_lift_id: lift.base_lift_id,
            },
          });

          if (!userLiftData) {
            await prisma.userLiftsData.create({
              data: {
                user_id: req.user.userId,
                base_lift_id: lift.base_lift_id,
                max_weights: [lift.weight[0]],
                rep_ranges: [parseInt(lift.reps[0].split("-")[0])],
                max_estimated: [
                  Math.round(
                    lift.weight[0] *
                      (1 + parseInt(lift.reps[0].split("-")[0]) / 30)
                  ),
                ],
                created_at: new Date(),
              },
            });
          } else {
            const index = userLiftData.rep_ranges.indexOf(
              parseInt(lift.reps[0].split("-")[0])
            );
            const newMaxWeight = Math.max(
              lift.weight[0],
              userLiftData.max_weights[index] || 0
            );
            const newMaxEstimated = Math.round(
              newMaxWeight * (1 + parseInt(lift.reps[0].split("-")[0]) / 30)
            );

            const updatedMaxWeights = [...userLiftData.max_weights];
            const updatedMaxEstimated = [...userLiftData.max_estimated];
            if (index >= 0) {
              updatedMaxWeights[index] = newMaxWeight;
              updatedMaxEstimated[index] = newMaxEstimated;
            } else {
              updatedMaxWeights.push(newMaxWeight);
              updatedMaxEstimated.push(newMaxEstimated);
              userLiftData.rep_ranges.push(
                parseInt(lift.reps[0].split("-")[0])
              );
            }

            await prisma.userLiftsData.update({
              where: { id: userLiftData.id },
              data: {
                max_weights: updatedMaxWeights,
                rep_ranges: userLiftData.rep_ranges,
                max_estimated: updatedMaxEstimated,
              },
            });
          }
        }
      }

      res.json({ message: "Workout completed", workoutId });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = workoutController;
