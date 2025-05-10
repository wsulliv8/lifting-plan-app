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

  async getPlanById(req, res, next) {
    console.log("in controller");

    const planId = parseInt(req.params.id);
    const { include } = req.query;

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
      res.json(plan);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch plan" });
    }
  },
};

module.exports = planController;
