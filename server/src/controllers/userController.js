const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { validateEmail, validatePassword } = require("../utils/authUtils");

const prisma = new PrismaClient();

const userController = {
  // Get UserLiftsData for the authenticated user
  async getUserLiftsData(req, res, next) {
    try {
      const userId = req.user.userId;
      console.log("Fetching lifts data for userId:", userId);
      const userLiftsData = await prisma.userLiftsData.findMany({
        where: { user_id: userId },
        select: {
          id: true,
          user_id: true,
          base_lift_id: true,
          rep_range_progress: true,
          base_lift: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      console.log(
        "Found user lifts data:",
        JSON.stringify(userLiftsData, null, 2)
      );
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

  async updateUser(req, res, next) {
    try {
      const userId = req.user.userId;
      const { email, username, password, experience } = req.body;

      // Validate email if provided
      if (email) {
        if (!validateEmail(email)) {
          return res.status(400).json({ error: "Invalid email format" });
        }

        // Check if email is already taken
        const existingUser = await prisma.users.findFirst({
          where: {
            email,
            NOT: {
              id: userId,
            },
          },
        });
        if (existingUser) {
          return res.status(400).json({ error: "Email already in use" });
        }
      }

      // Check if username is already taken
      if (username) {
        const existingUser = await prisma.users.findFirst({
          where: {
            username,
            NOT: {
              id: userId,
            },
          },
        });
        if (existingUser) {
          return res.status(400).json({ error: "Username already in use" });
        }
      }

      // Validate password if provided
      if (password) {
        if (!validatePassword(password)) {
          return res
            .status(400)
            .json({ error: "Password must be at least 8 characters" });
        }
      }

      // Validate experience level
      if (
        experience &&
        !["beginner", "intermediate", "advanced"].includes(experience)
      ) {
        return res.status(400).json({ error: "Invalid experience level" });
      }

      // Prepare update data
      const updateData = {
        ...(email && { email }),
        ...(username && { username }),
        ...(experience && { experience }),
      };

      // Handle password update separately
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
      }

      // Update user
      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          experience: true,
        },
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      if (error.code === "P2002") {
        // Prisma unique constraint violation
        res.status(400).json({ error: "Email or username already taken" });
      } else {
        res.status(500).json({ error: "Failed to update user" });
      }
    }
  },
};

module.exports = userController;
