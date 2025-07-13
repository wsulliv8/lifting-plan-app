const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const {
  signToken,
  validateEmail,
  validatePassword,
  validateUsername,
} = require("../utils/authUtils");

const prisma = new PrismaClient();

const authController = {
  async registerUser(req, res, next) {
    try {
      const { email, username, password } = req.body;

      // Validate required fields
      if (!email || !username || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate email format
      if (!validateEmail(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Validate username format
      if (!validateUsername(username)) {
        return res.status(400).json({
          error:
            "Username must be 3-30 characters and contain only letters, numbers, hyphens, and underscores",
        });
      }

      // Validate password strength
      if (!validatePassword(password)) {
        return res.status(400).json({
          error:
            "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        });
      }

      // Check for existing user
      const existingUser = await prisma.users.findFirst({
        where: { OR: [{ email }, { username }] },
      });
      if (existingUser) {
        return res
          .status(409)
          .json({ error: "Email or username already exists" });
      }

      // Hash password with stronger salt rounds
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.users.create({
        data: {
          email,
          username,
          password: hashedPassword,
          created_at: new Date(),
        },
      });

      // Don't expose sensitive information
      res.status(201).json({
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  },

  async loginUser(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ error: "Missing email or password" });
      }

      // Validate email format
      if (!validateEmail(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Find user by email
      const user = await prisma.users.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate token
      const token = signToken({ userId: user.id, role: user.role });

      // Return secure response
      res.json({
        token,
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
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
