const { WebSocketServer, WebSocket } = require("ws");
const prisma = require("../../prisma/client");
const { verifyToken } = require("../utils/authUtils");
const workoutSessionStore = require("../services/workoutSessionStore");

const VALID_SET_STATUS = new Set(["pending", "in_progress", "done"]);

function sendJson(socket, payload) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function parseToken(request, url) {
  const authHeader = request.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }
  return url.searchParams.get("token");
}

async function hasWorkoutAccess(workoutId, userId) {
  const workout = await prisma.workouts.findUnique({
    where: { id: workoutId },
    select: { id: true, user_id: true },
  });
  if (!workout) return false;
  return workout.user_id === null || workout.user_id === userId;
}

async function getDisplayName(userId) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  return user?.username || `User ${userId}`;
}

function createClientState(decodedToken) {
  return {
    userId: decodedToken.userId,
    role: decodedToken.role || "user",
    displayName: null,
    joinedSessionId: null,
    joinedWorkoutId: null,
  };
}

function setupWorkoutRealtimeGateway(server) {
  const wss = new WebSocketServer({
    server,
    path: "/realtime/workouts",
  });

  const socketsBySessionId = new Map();

  function registerSocketForSession(sessionId, socket) {
    const sockets = socketsBySessionId.get(sessionId) || new Set();
    sockets.add(socket);
    socketsBySessionId.set(sessionId, sockets);
  }

  function unregisterSocketForSession(sessionId, socket) {
    const sockets = socketsBySessionId.get(sessionId);
    if (!sockets) return;
    sockets.delete(socket);
    if (sockets.size === 0) {
      socketsBySessionId.delete(sessionId);
    }
  }

  function broadcast(sessionId, payload) {
    const sockets = socketsBySessionId.get(sessionId);
    if (!sockets) return;
    sockets.forEach((socket) => sendJson(socket, payload));
  }

  wss.on("connection", async (socket, request) => {
    const url = new URL(request.url, "http://localhost");
    const token = parseToken(request, url);
    if (!token) {
      sendJson(socket, {
        eventVersion: "v1",
        event: "error",
        error: "Missing auth token",
      });
      socket.close(1008, "Missing auth token");
      return;
    }

    let clientState;
    try {
      const decoded = verifyToken(token);
      clientState = createClientState(decoded);
      clientState.displayName = await getDisplayName(clientState.userId);
    } catch (error) {
      sendJson(socket, {
        eventVersion: "v1",
        event: "error",
        error: "Invalid auth token",
      });
      socket.close(1008, "Invalid auth token");
      return;
    }

    socket.on("message", async (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage.toString());
        const event = message?.event;
        const rawSessionId = (message?.sessionId || "").trim();
        const sessionId = rawSessionId || clientState.joinedSessionId || "global";
        const workoutId = Number(message?.workoutId);

        if (event === "join" && (!Number.isInteger(workoutId) || workoutId <= 0)) {
          sendJson(socket, {
            eventVersion: "v1",
            event: "error",
            error: "Invalid or missing workoutId",
          });
          return;
        }

        if (event === "join") {
          const hasAccess = await hasWorkoutAccess(workoutId, clientState.userId);
          if (!hasAccess) {
            sendJson(socket, {
              eventVersion: "v1",
              event: "error",
              error: "Unauthorized workout access",
            });
            return;
          }

          clientState.joinedSessionId = sessionId;
          clientState.joinedWorkoutId = workoutId;
          registerSocketForSession(sessionId, socket);
          const snapshot = workoutSessionStore.join(sessionId, {
            userId: clientState.userId,
            displayName: clientState.displayName,
            workoutId,
          });
          sendJson(socket, {
            eventVersion: "v1",
            event: "session_snapshot",
            ...snapshot,
          });
          broadcast(sessionId, {
            eventVersion: "v1",
            event: "participant_presence",
            sessionId: snapshot.sessionId,
            participants: snapshot.participants,
          });
          return;
        }

        if (event === "leave") {
          unregisterSocketForSession(sessionId, socket);
          if (clientState.joinedSessionId === sessionId) {
            clientState.joinedSessionId = null;
            clientState.joinedWorkoutId = null;
          }
          const snapshot = workoutSessionStore.leave(sessionId, clientState.userId);
          if (snapshot) {
            broadcast(sessionId, {
              eventVersion: "v1",
              event: "participant_presence",
              sessionId: snapshot.sessionId,
              participants: snapshot.participants,
            });
          }
          return;
        }

        if (event === "heartbeat") {
          const snapshot = workoutSessionStore.heartbeat(
            sessionId,
            clientState.userId
          );
          if (snapshot) {
            sendJson(socket, {
              eventVersion: "v1",
              event: "participant_presence",
              sessionId: snapshot.sessionId,
              participants: snapshot.participants,
            });
          }
          return;
        }

        if (event === "self_progress_update") {
          const progress = message?.progress || {};
          const participantUserId = message?.participantUserId;
          if (participantUserId && participantUserId !== clientState.userId) {
            sendJson(socket, {
              eventVersion: "v1",
              event: "error",
              error: "Cannot publish progress for another user",
            });
            return;
          }

          if (
            typeof progress.exerciseIndex !== "number" ||
            typeof progress.setIndex !== "number" ||
            !VALID_SET_STATUS.has(progress.setStatus)
          ) {
            sendJson(socket, {
              eventVersion: "v1",
              event: "error",
              error:
                "Invalid progress payload. Expected exerciseIndex, setIndex, setStatus.",
            });
            return;
          }

          const normalizedProgress = {
            clientEventId:
              message?.clientEventId || `${clientState.userId}-${Date.now()}`,
            exerciseIndex: progress.exerciseIndex,
            setIndex: progress.setIndex,
            setStatus: progress.setStatus,
            updatedAt: progress.updatedAt || new Date().toISOString(),
          };

          const broadcastPayload = workoutSessionStore.updateSelfProgress(
            sessionId,
            clientState.userId,
            normalizedProgress
          );

          broadcast(sessionId, {
            eventVersion: "v1",
            event: "participant_progress_broadcast",
            ...broadcastPayload,
          });
          return;
        }

        if (event === "session_complete") {
          const snapshot = workoutSessionStore.getSnapshot(sessionId);
          broadcast(sessionId, {
            eventVersion: "v1",
            event: "session_complete",
            sessionId: snapshot?.sessionId || sessionId,
          });
          return;
        }

        sendJson(socket, {
          eventVersion: "v1",
          event: "error",
          error: `Unsupported event: ${event}`,
        });
      } catch (error) {
        sendJson(socket, {
          eventVersion: "v1",
          event: "error",
          error: error.message || "Invalid realtime message",
        });
      }
    });

    socket.on("close", () => {
      if (clientState?.joinedSessionId) {
        const sessionId = clientState.joinedSessionId;
        unregisterSocketForSession(sessionId, socket);
        const snapshot = workoutSessionStore.leave(sessionId, clientState.userId);
        if (snapshot) {
          broadcast(sessionId, {
            eventVersion: "v1",
            event: "participant_presence",
            sessionId: snapshot.sessionId,
            participants: snapshot.participants,
          });
        }
      }
    });
  });

  return wss;
}

module.exports = { setupWorkoutRealtimeGateway };
