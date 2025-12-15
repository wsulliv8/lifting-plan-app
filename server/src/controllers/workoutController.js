const prisma = require("../../prisma/client");
const progressionAlgorithm = require("../utils/progressionAlgorithm");

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
      if (isNaN(workoutId)) {
        throw new Error("Invalid workout ID", { cause: { status: 400 } });
      }

      const { lifts: updatedLifts } = req.body;
      if (!updatedLifts || !Array.isArray(updatedLifts)) {
        throw new Error("Invalid or missing lifts data", {
          cause: { status: 400 },
        });
      }

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
        if (!updatedLift.id || !updatedLift.completed) {
          throw new Error(
            `Invalid lift data for lift ID ${updatedLift.id || "unknown"}`,
            {
              cause: { status: 400 },
            }
          );
        }
        await prisma.lifts.update({
          where: { id: updatedLift.id },
          data: {
            completed: updatedLift.completed,
            reps_achieved:
              updatedLift.reps_achieved?.map((lift) => parseInt(lift)) ?? [],
            weight_achieved:
              updatedLift.weight_achieved?.map((lift) => parseFloat(lift)) ??
              [],
            rpe_achieved:
              updatedLift.rpe_achieved?.map((lift) => parseInt(lift)) ?? [],
            volume: updatedLift.volume,
            notes: updatedLift.notes,
          },
        });
      }

      // Refresh workout data after updates
      const refreshedWorkout = await prisma.workouts.findUnique({
        where: { id: workoutId },
        include: {
          lifts: {
            include: { base_lift: true },
          },
          plan: {
            include: {
              weeks: {
                include: {
                  days: {
                    include: {
                      workoutDays: {
                        include: {
                          workout: {
                            include: { lifts: true },
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

      if (!refreshedWorkout) {
        throw new Error("Failed to refresh workout data", {
          cause: { status: 500 },
        });
      }

      // Calculate workout success based on lift performance
      let workoutSuccess = true;

      // Process progression for completed lifts using refreshed data
      for (const lift of refreshedWorkout.lifts) {
        if (lift.completed && lift.progression_rule) {
          try {
            const weightAdjustment =
              progressionAlgorithm.adjustFutureWeights(lift);

            if (weightAdjustment < 0) {
              workoutSuccess = false;
            }

            if (weightAdjustment !== 0 && refreshedWorkout.plan) {
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

            let rep_range_progress;

            if (!userLiftData) {
              rep_range_progress = { rep_ranges: {} };

              for (let i = 0; i < lift.weight.length; i++) {
                const weight = lift.weight_achieved[i];
                const actualReps = parseInt(lift.reps_achieved[i]);

                if (isNaN(weight) || isNaN(actualReps)) {
                  throw new Error(
                    `Invalid weight or reps for lift ${lift.id}`,
                    {
                      cause: { status: 400 },
                    }
                  );
                }

                const reps =
                  actualReps <= 3 ? actualReps : Math.floor(actualReps / 2) * 2;
                const estimated_max = weight;

                rep_range_progress.rep_ranges[reps] = {
                  current: {
                    weight,
                    estimated_max,
                  },
                  history: [
                    {
                      date: new Date().toISOString(),
                      weight,
                      estimated_max,
                    },
                  ],
                };
              }

              await prisma.userLiftsData.create({
                data: {
                  user_id: req.user.userId,
                  base_lift_id: lift.base_lift_id,
                  rep_range_progress,
                },
              });
            } else {
              rep_range_progress = userLiftData.rep_range_progress;

              for (let i = 0; i < lift.weight.length; i++) {
                const weight = lift.weight_achieved[i];
                const actualReps = parseInt(lift.reps_achieved[i]);

                if (isNaN(weight) || isNaN(actualReps)) {
                  throw new Error(
                    `Invalid weight or reps for lift ${lift.id}`,
                    {
                      cause: { status: 400 },
                    }
                  );
                }

                const reps =
                  actualReps <= 3 ? actualReps : Math.floor(actualReps / 2) * 2;

                if (!rep_range_progress.rep_ranges[reps]) {
                  const existingReps = Object.keys(
                    rep_range_progress.rep_ranges
                  )
                    .map((r) => parseInt(r))
                    .filter((r) => r < reps)
                    .sort((a, b) => b - a);

                  if (existingReps.length > 0) {
                    const closestLowerReps = existingReps[0];
                    const lowerRangeData =
                      rep_range_progress.rep_ranges[closestLowerReps];
                    if (weight >= lowerRangeData.current.weight) {
                      const repDifference = reps - closestLowerReps;
                      const adjustment =
                        progressionAlgorithm.calculateWeightAdjustment(
                          lowerRangeData.current.weight,
                          weight,
                          repDifference
                        );

                      Object.entries(rep_range_progress.rep_ranges).forEach(
                        ([otherReps, data]) => {
                          if (otherReps !== reps.toString()) {
                            const newEstimatedMax =
                              progressionAlgorithm.applyWeightAdjustment(
                                data.current.estimated_max,
                                adjustment,
                                parseInt(otherReps) < reps ? 1.1 : 0.9
                              );

                            data.current.estimated_max = newEstimatedMax;
                            data.history.push({
                              date: new Date().toISOString(),
                              weight: data.current.weight,
                              estimated_max: newEstimatedMax,
                            });
                          }
                        }
                      );
                    }
                  }
                  rep_range_progress.rep_ranges[reps] = {
                    current: {
                      weight,
                      estimated_max: weight,
                    },
                    history: [
                      {
                        date: new Date().toISOString(),
                        weight,
                        estimated_max: weight,
                      },
                    ],
                  };
                } else {
                  const repRangeData = rep_range_progress.rep_ranges[reps];
                  if (weight > repRangeData.current.weight) {
                    const adjustment =
                      progressionAlgorithm.calculateWeightAdjustment(
                        repRangeData.current.weight,
                        weight,
                        0
                      );
                    repRangeData.current.weight = weight;
                    repRangeData.current.estimated_max = weight;
                    repRangeData.history.push({
                      date: new Date().toISOString(),
                      weight,
                      estimated_max: weight,
                    });

                    Object.entries(rep_range_progress.rep_ranges).forEach(
                      ([otherReps, data]) => {
                        if (otherReps !== reps.toString()) {
                          const newEstimatedMax =
                            progressionAlgorithm.applyWeightAdjustment(
                              data.current.estimated_max,
                              adjustment,
                              parseInt(otherReps) < reps ? 1.1 : 0.9
                            );
                          console.log(newEstimatedMax);
                          data.current.estimated_max = newEstimatedMax;
                          data.history.push({
                            date: new Date().toISOString(),
                            weight: data.current.weight,
                            estimated_max: newEstimatedMax,
                          });
                        }
                      }
                    );
                  }
                }
              }

              await prisma.userLiftsData.update({
                where: { id: userLiftData.id },
                data: { rep_range_progress },
              });
            }

            // Track monthly volume metrics
            if (!rep_range_progress.monthly_volume) {
              rep_range_progress.monthly_volume = {};
            }

            const monthKey = new Date().toISOString().substring(0, 7); // YYYY-MM format
            const totalSets = lift.weight_achieved.length;
            const totalReps = lift.reps_achieved.reduce(
              (sum, reps) => sum + reps,
              0
            );
            const totalVolume = lift.volume || 0;

            if (!rep_range_progress.monthly_volume[monthKey]) {
              rep_range_progress.monthly_volume[monthKey] = {
                sets: totalSets,
                reps: totalReps,
                volume: totalVolume,
              };
            } else {
              rep_range_progress.monthly_volume[monthKey].sets += totalSets;
              rep_range_progress.monthly_volume[monthKey].reps += totalReps;
              rep_range_progress.monthly_volume[monthKey].volume += totalVolume;
            }

            await prisma.userLiftsData.update({
              where: { id: userLiftData.id },
              data: { rep_range_progress },
            });
          } catch (progressionError) {
            console.error(
              `Progression error for lift ${lift.id}:`,
              progressionError
            );
            throw new Error(
              `Failed to process progression for lift ${lift.id}`,
              {
                cause: { status: 500, originalError: progressionError },
              }
            );
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

        await prisma.plans.update({
          where: { id: refreshedWorkout.plan.id },
          data: {
            current_workout_id: nextWorkout ? nextWorkout.id : null,
          },
        });
      }

      res.json({ message: "Workout completed", workoutId });
    } catch (error) {
      console.error("Error in completeWorkout:", {
        message: error.message,
        status: error.cause?.status || 500,
        stack: error.stack,
      });

      const status = error.cause?.status || 500;
      res.status(status).json({
        error: error.message || "Internal server error",
        status,
      });
    }
  },
};

module.exports = workoutController;
