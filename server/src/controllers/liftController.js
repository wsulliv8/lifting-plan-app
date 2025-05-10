const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const liftController = {
  async createLift(req, res, next) {
    try {
      const {
        workout_id,
        base_lift_id,
        name,
        sets,
        reps,
        reps_achieved,
        weight,
        weight_achieved,
        rpe,
        rpe_achieved,
        rest_time,
        progression_rule,
        notes,
      } = req.body;

      if (
        !workout_id ||
        !base_lift_id ||
        !name ||
        !sets ||
        !reps ||
        !weight ||
        !rest_time
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate array lengths
      if (
        reps.length !== sets ||
        (reps_achieved && reps_achieved.length !== sets) ||
        weight.length !== sets ||
        (weight_achieved && weight_achieved.length !== sets) ||
        (rpe && rpe.length !== sets) ||
        (rpe_achieved && rpe_achieved.length !== sets) ||
        rest_time.length !== sets
      ) {
        return res
          .status(400)
          .json({ error: "Array fields must match number of sets" });
      }

      const workout = await prisma.workouts.findUnique({
        where: { id: workout_id },
      });
      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }

      const baseLift = await prisma.baseLifts.findUnique({
        where: { id: base_lift_id },
      });
      if (!baseLift) {
        return res.status(404).json({ error: "Base lift not found" });
      }

      const lift = await prisma.lifts.create({
        data: {
          workout_id,
          base_lift_id,
          name,
          completed: false,
          sets,
          reps,
          reps_achieved: reps_achieved || [],
          weight,
          weight_achieved: weight_achieved || [],
          rpe: rpe || [],
          rpe_achieved: rpe_achieved || [],
          rest_time,
          volume: weight.reduce(
            (sum, w, i) =>
              sum + w * (reps_achieved?.[i] || parseInt(reps[i].split("-")[0])),
            0
          ),
          progression_rule,
          notes,
          created_at: new Date(),
        },
      });

      res.status(201).json(lift);
    } catch (error) {
      res.status(500).json({ error: "Failed to create lift" });
    }
  },

  async getLifts(req, res, next) {
    try {
      const baseLifts = await prisma.baseLifts.findMany({
        orderBy: {
          name: "asc",
        },
      });
      res.json(baseLifts);
    } catch (error) {
      console.error("Error fetching BaseLifts:", error);
      res.status(500).json({ error: "Failed to fetch BaseLifts" });
    }
  },
};

module.exports = liftController;
