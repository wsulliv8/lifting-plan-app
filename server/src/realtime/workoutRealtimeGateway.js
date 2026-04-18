const { WebSocketServer, WebSocket } = require("ws");
const prisma = require("../../prisma/client");
const { verifyToken } = require("../utils/authUtils");
const workoutSessionStore = require("../services/workoutSessionStore");

const VALID_SET_STATUS = new Set(["pending", "in_progress", "done"]);

function rtLog(message, context = {}) {
  console.log(`[realtime] ${message}`, context);
}

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
    pendingSessionId: null,
    pendingWorkoutId: null,
  };
}

function setupWorkoutRealtimeGateway(server) {
  const wss = new WebSocketServer({
    server,
    path: "/realtime/workouts",
  });

  const socketsBySessionId = new Map();
  const socketsByUserId = new Map();
  const clientStateBySocket = new Map();

  function registerSocketForSession(sessionId, socket) {
    const sockets = socketsBySessionId.get(sessionId) || new Set();
    sockets.add(socket);
    socketsBySessionId.set(sessionId, sockets);
  }

  function registerSocketForUser(userId, socket) {
    const sockets = socketsByUserId.get(userId) || new Set();
    sockets.add(socket);
    socketsByUserId.set(userId, sockets);
  }

  function unregisterSocketForSession(sessionId, socket) {
    const sockets = socketsBySessionId.get(sessionId);
    if (!sockets) return;
    sockets.delete(socket);
    if (sockets.size === 0) {
      socketsBySessionId.delete(sessionId);
    }
  }

  function unregisterSocketForUser(userId, socket) {
    const sockets = socketsByUserId.get(userId);
    if (!sockets) return;
    sockets.delete(socket);
    if (sockets.size === 0) {
      socketsByUserId.delete(userId);
    }
  }

  function broadcast(sessionId, payload) {
    const sockets = socketsBySessionId.get(sessionId);
    if (!sockets) return;
    sockets.forEach((socket) => sendJson(socket, payload));
  }

  function sendSnapshot(socket, clientState, snapshot) {
    sendJson(socket, {
      eventVersion: "v1",
      event: "session_snapshot",
      ...snapshot,
      isHost: snapshot.hostUserId === clientState.userId,
    });
  }

  function clearPendingState(clientState) {
    clientState.pendingSessionId = null;
    clientState.pendingWorkoutId = null;
  }

  async function finalizeParticipantJoin(socket, clientState, sessionId, workoutId) {
    const snapshot = workoutSessionStore.joinApprovedParticipant(sessionId, {
      userId: clientState.userId,
      displayName: clientState.displayName,
      workoutId,
    });
    clientState.joinedSessionId = sessionId;
    clientState.joinedWorkoutId = workoutId;
    clearPendingState(clientState);
    registerSocketForSession(sessionId, socket);
    sendSnapshot(socket, clientState, snapshot);
    broadcast(sessionId, {
      eventVersion: "v1",
      event: "participant_presence",
      sessionId: snapshot.sessionId,
      participants: snapshot.participants,
    });
  }

  wss.on("connection", async (socket, request) => {
    const url = new URL(request.url, "http://localhost");
    const token = parseToken(request, url);
    rtLog("connection attempt", {
      path: url.pathname,
      hasToken: Boolean(token),
      queryKeys: Array.from(url.searchParams.keys()),
    });
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
      clientState.displayName = `User ${clientState.userId}`;
      clientStateBySocket.set(socket, clientState);
      registerSocketForUser(clientState.userId, socket);
      rtLog("connection authenticated", {
        userId: clientState.userId,
        role: clientState.role,
        displayName: clientState.displayName,
      });

      // Resolve display name in background so early client messages
      // (like immediate join on onOpen) are not dropped.
      getDisplayName(clientState.userId)
        .then((resolvedDisplayName) => {
          if (!clientStateBySocket.has(socket)) return;
          clientState.displayName = resolvedDisplayName;
          rtLog("display name resolved", {
            userId: clientState.userId,
            displayName: resolvedDisplayName,
          });
        })
        .catch((error) => {
          rtLog("display name lookup failed", {
            userId: clientState.userId,
            error: error.message,
          });
        });
    } catch (error) {
      rtLog("connection rejected: invalid token", { error: error.message });
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
        const rawSessionId = workoutSessionStore.normalizeSessionId(
          message?.sessionId || clientState.joinedSessionId || clientState.pendingSessionId
        );
        const sessionId = rawSessionId;
        const workoutId = Number(message?.workoutId);
        rtLog("message received", {
          userId: clientState.userId,
          event,
          sessionId,
          workoutId: Number.isFinite(workoutId) ? workoutId : null,
        });

        if (event === "join" && (!Number.isInteger(workoutId) || workoutId <= 0)) {
          rtLog("join rejected: invalid workoutId", {
            userId: clientState.userId,
            sessionId,
            workoutId,
          });
          sendJson(socket, {
            eventVersion: "v1",
            event: "error",
            error: "Invalid or missing workoutId",
          });
          return;
        }

        if (event === "join") {
          const joinAsHost = message?.mode === "host";
          if (!workoutSessionStore.isValidSessionCode(sessionId)) {
            rtLog("join rejected: invalid session code", {
              userId: clientState.userId,
              sessionId,
            });
            sendJson(socket, {
              eventVersion: "v1",
              event: "error",
              error: "Session code must be 8 characters (A-Z, 2-9).",
            });
            return;
          }

          const hasAccess = await hasWorkoutAccess(workoutId, clientState.userId);
          if (!hasAccess) {
            rtLog("join rejected: unauthorized workout access", {
              userId: clientState.userId,
              sessionId,
              workoutId,
            });
            sendJson(socket, {
              eventVersion: "v1",
              event: "error",
              error: "Unauthorized workout access",
            });
            return;
          }

          if (joinAsHost) {
            const snapshot = workoutSessionStore.createHostSession(sessionId, {
              userId: clientState.userId,
              displayName: clientState.displayName,
              workoutId,
            });
            clientState.joinedSessionId = sessionId;
            clientState.joinedWorkoutId = workoutId;
            clearPendingState(clientState);
            registerSocketForSession(sessionId, socket);
            rtLog("host joined session", {
              userId: clientState.userId,
              sessionId,
              workoutId,
              participantCount: snapshot.participants.length,
            });
            sendSnapshot(socket, clientState, snapshot);
            broadcast(sessionId, {
              eventVersion: "v1",
              event: "participant_presence",
              sessionId: snapshot.sessionId,
              participants: snapshot.participants,
            });
            return;
          }

          const joinRequest = workoutSessionStore.requestJoinApproval(sessionId, {
            userId: clientState.userId,
            displayName: clientState.displayName,
            workoutId,
          });
          rtLog("participant join request resolved", {
            userId: clientState.userId,
            sessionId,
            workoutId,
            status: joinRequest.status,
            message: joinRequest.message,
          });
          if (joinRequest.status === "approved") {
            await finalizeParticipantJoin(socket, clientState, sessionId, workoutId);
            rtLog("participant auto-approved and joined", {
              userId: clientState.userId,
              sessionId,
              workoutId,
            });
            return;
          }
          if (joinRequest.status === "pending") {
            clientState.pendingSessionId = sessionId;
            clientState.pendingWorkoutId = workoutId;
            sendJson(socket, {
              eventVersion: "v1",
              event: "join_request_status",
              sessionId,
              status: "pending",
              message: joinRequest.message,
            });
            const hostSnapshot = workoutSessionStore.getSnapshot(sessionId);
            const hostSockets =
              socketsByUserId.get(hostSnapshot?.hostUserId || -1) || new Set();
            rtLog("join request forwarded to host sockets", {
              sessionId,
              hostUserId: hostSnapshot?.hostUserId,
              hostSocketCount: hostSockets.size,
            });
            hostSockets.forEach((hostSocket) =>
              sendJson(hostSocket, {
                eventVersion: "v1",
                event: "join_request_received",
                sessionId,
                request: joinRequest.request,
              })
            );
            return;
          }

          sendJson(socket, {
            eventVersion: "v1",
            event: "join_request_status",
            sessionId,
            status: joinRequest.status,
            message: joinRequest.message,
          });
          return;
        }

        if (event === "leave") {
          unregisterSocketForSession(sessionId, socket);
          if (clientState.joinedSessionId === sessionId) {
            clientState.joinedSessionId = null;
            clientState.joinedWorkoutId = null;
          }
          if (clientState.pendingSessionId === sessionId) {
            clearPendingState(clientState);
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

        if (event === "approve_join_request") {
          const participantUserId = Number(message?.participantUserId);
          const approved = message?.approved !== false;
          if (!Number.isInteger(participantUserId) || participantUserId <= 0) {
            sendJson(socket, {
              eventVersion: "v1",
              event: "error",
              error: "Invalid participantUserId",
            });
            return;
          }

          const approval = workoutSessionStore.resolveJoinApproval(
            sessionId,
            clientState.userId,
            participantUserId,
            approved
          );
          if (approval.status === "approved") {
            const participantSockets = socketsByUserId.get(participantUserId) || new Set();
            rtLog("join approval accepted", {
              sessionId,
              hostUserId: clientState.userId,
              participantUserId,
              participantSocketCount: participantSockets.size,
            });
            let snapshot = null;
            participantSockets.forEach((participantSocket) => {
              const participantState = clientStateBySocket.get(participantSocket);
              if (
                !participantState ||
                participantState.pendingSessionId !== sessionId
              ) {
                return;
              }
              const participantWorkoutId = participantState.pendingWorkoutId;
              if (!participantWorkoutId) return;
              snapshot = workoutSessionStore.joinApprovedParticipant(sessionId, {
                userId: participantState.userId,
                displayName: participantState.displayName,
                workoutId: participantWorkoutId,
              });
              participantState.joinedSessionId = sessionId;
              participantState.joinedWorkoutId = participantWorkoutId;
              clearPendingState(participantState);
              registerSocketForSession(sessionId, participantSocket);
              sendJson(participantSocket, {
                eventVersion: "v1",
                event: "join_request_status",
                sessionId,
                status: "approved",
                message: approval.message,
              });
              sendSnapshot(participantSocket, participantState, snapshot);
            });

            if (snapshot) {
              broadcast(sessionId, {
                eventVersion: "v1",
                event: "participant_presence",
                sessionId: snapshot.sessionId,
                participants: snapshot.participants,
              });
            }

            sendJson(socket, {
              eventVersion: "v1",
              event: "join_request_status",
              sessionId,
              status: "approved",
              message: approval.message,
            });
            return;
          }

          if (approval.status === "rejected") {
            const participantSockets = socketsByUserId.get(participantUserId) || new Set();
            rtLog("join approval rejected", {
              sessionId,
              hostUserId: clientState.userId,
              participantUserId,
              participantSocketCount: participantSockets.size,
            });
            participantSockets.forEach((participantSocket) => {
              const participantState = clientStateBySocket.get(participantSocket);
              if (
                !participantState ||
                participantState.pendingSessionId !== sessionId
              ) {
                return;
              }
              clearPendingState(participantState);
              sendJson(participantSocket, {
                eventVersion: "v1",
                event: "join_request_status",
                sessionId,
                status: "rejected",
                message: approval.message,
              });
            });
            sendJson(socket, {
              eventVersion: "v1",
              event: "join_request_status",
              sessionId,
              status: "rejected",
              message: approval.message,
            });
            return;
          }

          sendJson(socket, {
            eventVersion: "v1",
            event: "error",
            error: approval.message || "Unable to process join approval.",
          });
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
            weightAchieved:
              typeof progress.weightAchieved === "string"
                ? progress.weightAchieved
                : null,
            repsAchieved:
              typeof progress.repsAchieved === "string"
                ? progress.repsAchieved
                : null,
            notes: typeof progress.notes === "string" ? progress.notes : null,
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
        rtLog("message handler error", {
          userId: clientState?.userId,
          error: error.message,
        });
        sendJson(socket, {
          eventVersion: "v1",
          event: "error",
          error: error.message || "Invalid realtime message",
        });
      }
    });

    socket.on("close", () => {
      rtLog("socket closed", {
        userId: clientState?.userId,
        joinedSessionId: clientState?.joinedSessionId,
        pendingSessionId: clientState?.pendingSessionId,
      });
      unregisterSocketForUser(clientState?.userId, socket);
      clientStateBySocket.delete(socket);
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
      if (clientState?.pendingSessionId) {
        clearPendingState(clientState);
      }
    });
  });

  return wss;
}

module.exports = { setupWorkoutRealtimeGateway };
