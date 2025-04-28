const express = require("express");
const https = require("https");
const fs = require("fs");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const planRoutes = require("./routes/planRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const liftRoutes = require("./routes/liftRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: "https://localhost:5173" })); // Allow React frontend (localhost:5173) to connect
app.use(express.json()); // Parse JSON bodies
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/lifts", liftRoutes);

// Error handling middleware
app.use(errorMiddleware);

// HTTPS options
const options = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
};

// Start HTTPS server
const PORT = process.env.PORT || 3001;
https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS server running on port ${PORT}`);
});
