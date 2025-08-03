const express = require("express");
const https = require("https");
const fs = require("fs");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const planRoutes = require("./routes/planRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const liftRoutes = require("./routes/liftRoutes");
const userRoutes = require("./routes/userRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");
const {
  securityHeaders,
  generalRateLimit,
  authRateLimit,
  loginRateLimit,
  sanitizeInput,
} = require("./middleware/securityMiddleware");

dotenv.config();

const app = express();

// Trust proxy for Render deployment
app.set("trust proxy", 1);

// Security middleware - apply first
app.use(securityHeaders);
app.use(generalRateLimit);
app.use(sanitizeInput);

// CORS configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL
      : "https://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes with specific rate limiting
app.use("/api/auth/login", loginRateLimit);
app.use("/api/auth", authRateLimit, authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/lifts", liftRoutes);
app.use("/api/user", userRoutes);

// Error handling middleware
app.use(errorMiddleware);

// Start server based on environment
const PORT = process.env.PORT || 3001;

// if (process.env.NODE_ENV === "production") {
// Production: Use HTTP (Render handles HTTPS)
app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});
/* } else {
  // Development: Use HTTPS with SSL certificates
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  };

  https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS server running on port ${PORT}`);
  });
} */
