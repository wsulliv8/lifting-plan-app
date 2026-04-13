const prisma = require("../../prisma/client");
const workoutSessionStore = require("../services/workoutSessionStore");

const VALID_SET_STATUS = new Set(["pending", "in_progress", "done"]);

async function getAccessibleWorkout(workoutId, userId) {
  const workout = await prisma.workouts.findUnique({
    where: { id: workoutId },
    select: { id: true, user_id: true },
  });

  if (!workout) {
    throw new Error("Workout not found", { cause: { status: 404 } });
  }

  if (workout.user_id !== null && workout.user_id !== userId) {
    throw new Error("Unauthorized access to this workout", {
      cause: { status: 403 },
    });
  }

  return workout;
}

async function getDisplayName(userId) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  return user?.username || `User ${userId}`;
}

function parseWorkoutId(rawId) {
  const workoutId = parseInt(rawId, 10);
  if (Number.isNaN(workoutId)) {
    throw new Error("Invalid workout ID", { cause: { status: 400 } });
  }
  return workoutId;
}

function normalizeSessionId(rawValue) {
  const sessionId = (rawValue || "").trim();
  return sessionId || "global";
}

const workoutSessionController = {
  async joinSession(req, res, next) {
    try {
      const workoutId = parseWorkoutId(req.params.id);
      const userId = req.user.userId;
      await getAccessibleWorkout(workoutId, userId);
      const sessionId = normalizeSessionId(req.body?.sessionId);

      const displayName = await getDisplayName(userId);
      const snapshot = workoutSessionStore.join(sessionId, {
        userId,
        displayName,
        workoutId,
      });

      res.json({
        eventVersion: "v1",
        event: "session_snapshot",
        ...snapshot,
      });
    } catch (error) {
      next(error);
    }
  },

  async leaveSession(req, res, next) {
    try {
      const workoutId = parseWorkoutId(req.params.id);
      const userId = req.user.userId;
      await getAccessibleWorkout(workoutId, userId);
      const sessionId = normalizeSessionId(req.body?.sessionId);

      const snapshot = workoutSessionStore.leave(sessionId, userId);
      res.json({
        eventVersion: "v1",
        event: "participant_presence",
        ...(snapshot || {
          sessionId,
          participants: [],
          progressByUser: {},
        }),
      });
    } catch (error) {
      next(error);
    }
  },

  async heartbeat(req, res, next) {
    try {
      const workoutId = parseWorkoutId(req.params.id);
      const userId = req.user.userId;
      await getAccessibleWorkout(workoutId, userId);
      const sessionId = normalizeSessionId(req.body?.sessionId);

      const snapshot = workoutSessionStore.heartbeat(sessionId, userId);
      res.json({
        eventVersion: "v1",
        event: "participant_presence",
        ...(snapshot || {
          sessionId,
          participants: [],
          progressByUser: {},
        }),
      });
    } catch (error) {
      next(error);
    }
  },

  async getSnapshot(req, res, next) {
    try {
      const workoutId = parseWorkoutId(req.params.id);
      const userId = req.user.userId;
      await getAccessibleWorkout(workoutId, userId);
      const sessionId = normalizeSessionId(req.query.sessionId);

      const snapshot =
        workoutSessionStore.getSnapshot(sessionId) || {
          sessionId,
          participants: [],
          progressByUser: {},
        };

      res.json({
        eventVersion: "v1",
        event: "session_snapshot",
        ...snapshot,
      });
    } catch (error) {
      next(error);
    }
  },

  async publishSelfProgress(req, res, next) {
    try {
      const workoutId = parseWorkoutId(req.params.id);
      const userId = req.user.userId;
      await getAccessibleWorkout(workoutId, userId);
      const sessionId = normalizeSessionId(req.body?.sessionId);

      const { clientEventId, progress, participantUserId } = req.body || {};
      if (!progress || typeof progress !== "object") {
        return res
          .status(400)
          .json({ error: "Missing progress object in request body" });
      }
      if (participantUserId && participantUserId !== userId) {
        return res.status(403).json({
          error: "Cannot publish progress for another participant",
        });
      }
      if (
        !VALID_SET_STATUS.has(progress.setStatus) ||
        typeof progress.exerciseIndex !== "number" ||
        typeof progress.setIndex !== "number"
      ) {
        return res.status(400).json({
          error:
            "Invalid progress payload. Expected exerciseIndex, setIndex, and setStatus.",
        });
      }

      const payload = {
        clientEventId: clientEventId || `${userId}-${Date.now()}`,
        exerciseIndex: progress.exerciseIndex,
        setIndex: progress.setIndex,
        setStatus: progress.setStatus,
        updatedAt: progress.updatedAt || new Date().toISOString(),
      };

      const broadcast = workoutSessionStore.updateSelfProgress(
        sessionId,
        userId,
        payload
      );

      res.json({
        eventVersion: "v1",
        event: "participant_progress_broadcast",
        ...broadcast,
      });
    } catch (error) {
      if (error.message === "Must join session before publishing progress") {
        return res.status(409).json({ error: error.message });
      }
      next(error);
    }
  },
};

module.exports = workoutSessionController;
