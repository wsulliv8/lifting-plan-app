const express = require("express");
const workoutController = require("../controllers/workoutController");
const workoutSessionController = require("../controllers/workoutSessionController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/workouts?plan_id=:id
router.get("/", authMiddleware, workoutController.getWorkouts);

// GET /api/workouts?id=:id
router.get("/:id", authMiddleware, workoutController.getWorkoutById);

// POST /api/workouts/:id/complete
router.post("/:id/complete", authMiddleware, workoutController.completeWorkout);

// Multi-user prep (REST scaffold before WebSocket integration)
router.post(
  "/:id/session/join",
  authMiddleware,
  workoutSessionController.joinSession
);
router.post(
  "/:id/session/leave",
  authMiddleware,
  workoutSessionController.leaveSession
);
router.post(
  "/:id/session/heartbeat",
  authMiddleware,
  workoutSessionController.heartbeat
);
router.get(
  "/:id/session/snapshot",
  authMiddleware,
  workoutSessionController.getSnapshot
);
router.post(
  "/:id/session/progress",
  authMiddleware,
  workoutSessionController.publishSelfProgress
);

module.exports = router;
