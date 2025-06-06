const express = require("express");
const workoutController = require("../controllers/workoutController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/workouts?plan_id=:id
router.get("/", authMiddleware, workoutController.getWorkouts);

// GET /api/workouts?id=:id
router.get("/:id", authMiddleware, workoutController.getWorkoutById);

// POST /api/workouts/:id/complete
router.post("/:id/complete", authMiddleware, workoutController.completeWorkout);

module.exports = router;
