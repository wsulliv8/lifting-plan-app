const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../middleware/authMiddleware");

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/plans
router.get("/", authMiddleware, async (req, res) => {
  try {
    const plans = await prisma.plans.findMany({
      where: {
        OR: [{ user_id: req.user.userId }, { user_id: null }],
      },
      include: { workouts: true },
    });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// POST /api/plans
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, categories, description, duration_weeks, difficulty, goal } =
      req.body;
    if (!name || !categories || !duration_weeks || !difficulty || !goal) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const plan = await prisma.plans.create({
      data: {
        name,
        user_id: req.user.userId,
        categories,
        description,
        duration_weeks,
        difficulty,
        goal,
        created_at: new Date(),
      },
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: "Failed to create plan" });
  }
});

module.exports = router;
