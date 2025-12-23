const prisma = require("../../prisma/client");
const progressionAlgorithm = require("../utils/progressionAlgorithm");

// Helper function to normalize rep range
const normalizeRepRange = (actualReps) => {
  return actualReps <= 3 ? actualReps : Math.floor(actualReps / 2) * 2;
};

// Helper function to update estimated maxes for all other rep ranges
const updateOtherRepRangesEstimates = (
  rep_range_progress,
  adjustment,
  currentReps
) => {
  Object.entries(rep_range_progress.rep_ranges).forEach(([otherReps, data]) => {
    if (otherReps !== currentReps.toString()) {
      const newEstimatedMax = progressionAlgorithm.applyWeightAdjustment(
        data.current.estimated_max,
        adjustment,
        parseInt(otherReps) < currentReps ? 1.1 : 0.9
      );
      data.current.estimated_max = newEstimatedMax;
      data.history.push({
        date: new Date().toISOString(),
        weight: data.current.weight,
        estimated_max: newEstimatedMax,
      });
    }
  });
};

// Helper function to update rep range progress for a single set
const updateRepRangeProgress = (rep_range_progress, weight, actualReps) => {
  const reps = normalizeRepRange(actualReps);

  if (!rep_range_progress.rep_ranges[reps]) {
    // Create new rep range entry
    const existingReps = Object.keys(rep_range_progress.rep_ranges)
      .map((r) => parseInt(r))
      .filter((r) => r < reps)
      .sort((a, b) => b - a);

    if (existingReps.length > 0) {
      const closestLowerReps = existingReps[0];
      const lowerRangeData = rep_range_progress.rep_ranges[closestLowerReps];

      if (weight >= lowerRangeData.current.weight) {
        const repDifference = reps - closestLowerReps;
        const adjustment = progressionAlgorithm.calculateWeightAdjustment(
          lowerRangeData.current.weight,
          weight,
          repDifference
        );

        // Update all other rep ranges based on this achievement
        updateOtherRepRangesEstimates(rep_range_progress, adjustment, reps);
      }
    }

    rep_range_progress.rep_ranges[reps] = {
      current: { weight, estimated_max: weight },
      history: [
        { date: new Date().toISOString(), weight, estimated_max: weight },
      ],
    };
  } else {
    // Update existing rep range if new weight is higher
    const repRangeData = rep_range_progress.rep_ranges[reps];
    if (weight > repRangeData.current.weight) {
      const adjustment = progressionAlgorithm.calculateWeightAdjustment(
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

      // Update all other rep ranges
      updateOtherRepRangesEstimates(rep_range_progress, adjustment, reps);
    }
  }

  return rep_range_progress;
};

// Helper function to update monthly volume
const updateMonthlyVolume = (rep_range_progress, lift) => {
  if (!rep_range_progress.monthly_volume) {
    rep_range_progress.monthly_volume = {};
  }

  const monthKey = new Date().toISOString().substring(0, 7);
  const totalSets = lift.weight_achieved.length;
  const totalReps = lift.reps_achieved.reduce((sum, reps) => sum + reps, 0);
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

  return rep_range_progress;
};

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

      // Validate all lifts before starting transaction
      for (const lift of updatedLifts) {
        if (!lift.id || lift.completed === undefined) {
          throw new Error(
            `Invalid lift data for lift ID ${lift.id || "unknown"}`,
            {
              cause: { status: 400 },
            }
          );
        }
      }

      // Use transaction for atomicity
      const result = await prisma.$transaction(
        async (tx) => {
          // 1. Fetch workout with only necessary data
          const workout = await tx.workouts.findUnique({
            where: { id: workoutId },
            select: {
              id: true,
              week_number: true,
              day_of_week: true,
              plan_id: true,
              lifts: {
                select: {
                  id: true,
                  base_lift_id: true,
                  progression_rule: true,
                  weight: true,
                  reps: true,
                  weight_achieved: true,
                  reps_achieved: true,
                  volume: true,
                },
              },
            },
          });

          if (!workout) {
            throw new Error("Workout not found", { cause: { status: 404 } });
          }

          // 2. Batch update all lifts
          await Promise.all(
            updatedLifts.map((updatedLift) =>
              tx.lifts.update({
                where: { id: updatedLift.id },
                data: {
                  completed: updatedLift.completed,
                  reps_achieved:
                    updatedLift.reps_achieved?.map((r) => parseInt(r)) ?? [],
                  weight_achieved:
                    updatedLift.weight_achieved?.map((w) => parseFloat(w)) ??
                    [],
                  rpe_achieved:
                    updatedLift.rpe_achieved?.map((r) => parseInt(r)) ?? [],
                  volume: updatedLift.volume,
                  notes: updatedLift.notes,
                },
              })
            )
          );

          // 3. Process progression for completed lifts
          let workoutSuccess = true;
          const liftUpdates = [];

          for (const updatedLift of updatedLifts) {
            if (!updatedLift.completed) continue;

            const originalLift = workout.lifts.find(
              (l) => l.id === updatedLift.id
            );
            if (!originalLift?.progression_rule) continue;

            // Merge original lift data with updated data
            // Preserve progression_rule from database (don't let frontend overwrite it)
            const lift = {
              ...originalLift,
              ...updatedLift,
              progression_rule: originalLift.progression_rule, // Always use DB value
              reps_achieved: updatedLift.reps_achieved
                ?.filter((r) => r !== null && r !== undefined && r !== "")
                .map((r) => parseInt(r)),
              weight_achieved: updatedLift.weight_achieved
                ?.filter((w) => w !== null && w !== undefined && w !== "")
                .map((w) => parseFloat(w)),
            };

            const weightAdjustment =
              progressionAlgorithm.adjustFutureWeights(lift);
            if (weightAdjustment < 0) workoutSuccess = false;

            // 4. Apply progression to future lifts (if needed)
            if (weightAdjustment !== 0 && workout.plan_id) {
              const futureLifts = await tx.lifts.findMany({
                where: {
                  base_lift_id: lift.base_lift_id,
                  workout: {
                    plan_id: workout.plan_id,
                    OR: [
                      { week_number: { gt: workout.week_number } },
                      {
                        week_number: workout.week_number,
                        day_of_week: { gt: workout.day_of_week },
                      },
                    ],
                  },
                },
                select: { id: true, weight: true },
              });

              liftUpdates.push(
                ...futureLifts.map((futureLift) => ({
                  id: futureLift.id,
                  weight: futureLift.weight.map((w) =>
                    Math.max(0, Number((w + weightAdjustment).toFixed(1)))
                  ),
                }))
              );
            }

            // 5. Update user lift data (rep ranges and monthly volume)
            let userLiftData = await tx.userLiftsData.findFirst({
              where: {
                user_id: req.user.userId,
                base_lift_id: lift.base_lift_id,
              },
            });

            let rep_range_progress = userLiftData?.rep_range_progress || {
              rep_ranges: {},
            };

            // Update rep ranges for all sets
            for (let i = 0; i < lift.weight_achieved.length; i++) {
              const weight = lift.weight_achieved[i];
              const actualReps = lift.reps_achieved[i];

              if (isNaN(weight) || isNaN(actualReps)) {
                throw new Error(`Invalid weight or reps for lift ${lift.id}`, {
                  cause: { status: 400 },
                });
              }

              rep_range_progress = updateRepRangeProgress(
                rep_range_progress,
                weight,
                actualReps
              );
            }

            // Update monthly volume
            rep_range_progress = updateMonthlyVolume(rep_range_progress, lift);

            // Upsert user lift data
            if (userLiftData) {
              await tx.userLiftsData.update({
                where: { id: userLiftData.id },
                data: { rep_range_progress },
              });
            } else {
              await tx.userLiftsData.create({
                data: {
                  user_id: req.user.userId,
                  base_lift_id: lift.base_lift_id,
                  rep_range_progress,
                },
              });
            }
          }

          // 6. Batch update future lifts
          if (liftUpdates.length > 0) {
            await Promise.all(
              liftUpdates.map((update) =>
                tx.lifts.update({
                  where: { id: update.id },
                  data: { weight: update.weight },
                })
              )
            );
          }

          // 7. Update workout completion status
          await tx.workouts.update({
            where: { id: workoutId },
            data: {
              success: workoutSuccess,
              completed_at: new Date(),
            },
          });

          // 8. Auto-start plan if not started & update current workout
          if (workout.plan_id) {
            const plan = await tx.plans.findUnique({
              where: { id: workout.plan_id },
              select: { id: true, started_at: true },
            });

            // Find next workout (must have WorkoutDay link to be valid)
            const nextWorkout = await tx.workouts.findFirst({
              where: {
                plan_id: workout.plan_id,
                completed_at: null,
                workoutDays: { some: {} }, // Must have WorkoutDay link
                OR: [
                  { week_number: { gt: workout.week_number } },
                  {
                    week_number: workout.week_number,
                    day_of_week: { gt: workout.day_of_week },
                  },
                ],
              },
              orderBy: [{ week_number: "asc" }, { day_of_week: "asc" }],
              select: { id: true },
            });

            // Update plan: auto-start if needed + set next workout
            await tx.plans.update({
              where: { id: workout.plan_id },
              data: {
                started_at: plan?.started_at || new Date(),
                current_workout_id: nextWorkout?.id || null,
              },
            });
          }

          return { workoutId };
        },
        {
          timeout: 60000,
        }
      );

      // Get plan_id for response
      const verifyWorkout = await prisma.workouts.findUnique({
        where: { id: workoutId },
        select: { plan_id: true },
      });

      res.json({
        message: "Workout completed",
        ...result,
        plan_id: verifyWorkout.plan_id,
      });
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
