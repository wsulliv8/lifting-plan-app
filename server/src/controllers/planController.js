const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const planController = {
  async getPlans(req, res, next) {
    try {
      const userPlans = await prisma.plans.findMany({
        where: {
          user_id: req.user.userId,
        },
        include: { workouts: true },
      });
      const genericPlans = await prisma.plans.findMany({
        where: {
          user_id: null,
        },
        include: { workouts: true },
      });
      res.json({ userPlans, genericPlans });
    } catch (error) {
      next(error);
    }
  },

  async createPlan(req, res, next) {
    try {
      const {
        name,
        categories,
        description,
        duration_weeks,
        difficulty,
        goal,
      } = req.body;
      if (!name || !categories || !duration_weeks || !difficulty || !goal) {
        throw new Error("Missing required fields");
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
      next(error);
    }
  },
};

module.exports = planController;
