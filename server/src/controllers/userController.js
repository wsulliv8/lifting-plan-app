const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const userController = {
  // Get UserLiftsData for the authenticated user
  async getUserLiftsData(req, res, next) {
    try {
      const userId = req.user.userId;
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
  async getCurrentUser(req, res, next) {
    try {
      const userId = req.user.userId;
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          experience: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user info:", error);
      res.status(500).json({ error: "Failed to fetch user info" });
    }
  },
};

module.exports = userController;
