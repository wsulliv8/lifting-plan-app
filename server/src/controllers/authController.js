const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const {
  signToken,
  validateEmail,
  validatePassword,
} = require("../utils/authUtils");

const prisma = new PrismaClient();

const authController = {
  async registerUser(req, res, next) {
    try {
      const { email, username, password } = req.body;
      if (!email || !username || !password) {
        throw new Error("Missing required fields");
      }
      if (!validateEmail(email)) {
        throw new Error("Invalid email format");
      }
      if (!validatePassword(password)) {
        throw new Error("Password must be at least 8 characters");
      }

      const existingUser = await prisma.users.findFirst({
        where: { OR: [{ email }, { username }] },
      });
      if (existingUser) {
        throw new Error("Email or username already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.users.create({
        data: {
          email,
          username,
          password: hashedPassword,
          created_at: new Date(),
        },
      });

      res
        .status(201)
        .json({ userId: user.id, email: user.email, username: user.username, role: user.role });
    } catch (error) {
      next(error);
    }
  },

  async loginUser(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new Error("Missing email or password");
      }

      const user = await prisma.users.findUnique({ where: { email } });
      if (!user) {
        throw new Error("Invalid credentials");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      const token = signToken({ userId: user.id, role: user.role });
      res.json({
        token,
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });
    } catch (error) {
      next(error);
    }
  },

  async logoutUser(req, res, next) {
    try {
      // Client should clear JWT from localStorage
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
