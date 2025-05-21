const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const userController = {
  // Get UserLiftsData for the authenticated user
  async getUserLiftsData(req, res, next) {
    try {
      const userId = req.user.id;
      const userLiftsData = await prisma.userLiftsData.findMany({
        where: { user_id: userId },
        select: {
          base_lift_id: true,
          max_weights: true,
          rep_ranges: true,
          max_estimated: true,
        },
      });
      res.status(200).json(userLiftsData);
    } catch (error) {
      console.error("Error fetching UserLiftsData:", error);
      res.status(500).json({ error: "Failed to fetch user lifts data" });
    }
  },
};

module.exports = userController;
