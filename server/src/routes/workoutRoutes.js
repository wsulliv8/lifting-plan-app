const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../middleware/authMiddleware");

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/workouts?plan_id=:id
router.get("/", authMiddleware, async (req, res) => {
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
    res.status(500).json({ error: "Failed to fetch workouts" });
  }
});

// POST /api/workouts/:id/complete
router.post("/:id/complete", authMiddleware, async (req, res) => {
  try {
    const workoutId = parseInt(req.params.id);
    const workout = await prisma.workouts.findUnique({
      where: { id: workoutId },
      include: { lifts: { include: { base_lift: true } } },
    });

    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }

    // Update workout completion
    await prisma.workouts.update({
      where: { id: workoutId },
      data: {
        total_volume: workout.lifts.reduce(
          (sum, lift) => sum + (lift.volume || 0),
          0
        ),
      },
    });

    // Process progression for completed lifts
    for (const lift of workout.lifts) {
      if (lift.completed && lift.progression_rule) {
        const avgWeightAchieved =
          lift.weight_achieved.reduce((sum, w) => sum + w, 0) /
          lift.weight_achieved.length;
        const avgRepsAchieved =
          lift.reps_achieved.reduce((sum, r) => sum + r, 0) /
          lift.reps_achieved.length;
        const minReps = parseInt(lift.reps[0].split("-")[0]); // e.g., "8-10" -> 8

        // Find or create UserLiftsData
        let userLiftData = await prisma.userLiftsData.findFirst({
          where: { user_id: req.user.userId, base_lift_id: lift.base_lift_id },
        });

        if (!userLiftData) {
          userLiftData = await prisma.userLiftsData.create({
            data: {
              user_id: req.user.userId,
              base_lift_id: lift.base_lift_id,
              max_weights: [avgWeightAchieved],
              rep_ranges: [minReps],
              max_estimated: [
                Math.round(avgWeightAchieved * (1 + minReps / 30)),
              ], // Epley 1RM
              created_at: new Date(),
            },
          });
        } else {
          // Update max_weights and rep_ranges
          const index = userLiftData.rep_ranges.indexOf(minReps);
          const newMaxWeight = Math.max(
            avgWeightAchieved,
            userLiftData.max_weights[index] || 0
          );
          const newMaxEstimated = Math.round(newMaxWeight * (1 + minReps / 30));

          const updatedMaxWeights = [...userLiftData.max_weights];
          const updatedMaxEstimated = [...userLiftData.max_estimated];
          if (index >= 0) {
            updatedMaxWeights[index] = newMaxWeight;
            updatedMaxEstimated[index] = newMaxEstimated;
          } else {
            updatedMaxWeights.push(newMaxWeight);
            updatedMaxEstimated.push(newMaxEstimated);
            userLiftData.rep_ranges.push(minReps);
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
    res.status(500).json({ error: "Failed to complete workout" });
  }
});

module.exports = router;
