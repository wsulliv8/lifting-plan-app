class WorkoutSessionStore {
  constructor() {
    this.sessionsById = new Map();
    this.SESSION_CODE_REGEX = /^[A-HJ-NP-Z2-9]{8}$/;
    this.CODE_TTL_MS = 15 * 60 * 1000;
  }

  normalizeSessionId(rawSessionId) {
    return (rawSessionId || "").trim().toUpperCase();
  }

  isValidSessionCode(rawSessionId) {
    const sessionId = this.normalizeSessionId(rawSessionId);
    return this.SESSION_CODE_REGEX.test(sessionId);
  }

  createHostSession(rawSessionId, host) {
    const sessionId = this.normalizeSessionId(rawSessionId);
    if (!this.isValidSessionCode(sessionId)) {
      throw new Error("Session code must be 8 characters (A-Z, 2-9).");
    }

    const existingSession = this.sessionsById.get(sessionId);
    if (existingSession) {
      if (
        existingSession.hostUserId !== host.userId &&
        !this.isJoinCodeExpired(existingSession)
      ) {
        throw new Error("Session code is already in use.");
      }
      if (
        existingSession.hostUserId === host.userId &&
        this.isJoinCodeExpired(existingSession)
      ) {
        this.sessionsById.delete(sessionId);
      }
    }

    const session =
      this.sessionsById.get(sessionId) ||
      this.createSession(sessionId, host.userId);
    session.hostUserId = host.userId;
    this.setParticipantOnline(session, host);
    return this.toSnapshot(session, { includePendingRequests: true });
  }

  requestJoinApproval(rawSessionId, user) {
    const sessionId = this.normalizeSessionId(rawSessionId);
    if (!this.isValidSessionCode(sessionId)) {
      return {
        status: "invalid_code",
        message: "Session code must be 8 characters (A-Z, 2-9).",
      };
    }

    const session = this.sessionsById.get(sessionId);
    if (!session) {
      return {
        status: "not_found",
        message: "Session not found.",
      };
    }
    if (this.isJoinCodeExpired(session)) {
      this.sessionsById.delete(sessionId);
      return {
        status: "expired",
        message: "Session code has expired.",
      };
    }
    if (session.hostUserId === user.userId) {
      return {
        status: "host",
        message: "Host is already allowed in this session.",
      };
    }
    if (
      session.approvedParticipantUserId &&
      session.approvedParticipantUserId !== user.userId
    ) {
      return {
        status: "consumed",
        message: "This one-time code has already been used.",
      };
    }
    if (session.approvedParticipantUserId === user.userId) {
      return {
        status: "approved",
        message: "Join approval already granted.",
      };
    }

    const existing = session.pendingJoinRequests.get(user.userId);
    if (existing) {
      return {
        status: "pending",
        message: "Join request is pending host approval.",
        request: existing,
      };
    }

    const request = {
      userId: user.userId,
      displayName: user.displayName || `User ${user.userId}`,
      workoutId: user.workoutId,
      requestedAt: new Date().toISOString(),
    };
    session.pendingJoinRequests.set(user.userId, request);
    return {
      status: "pending",
      message: "Join request sent to host.",
      request,
    };
  }

  resolveJoinApproval(rawSessionId, hostUserId, participantUserId, approved) {
    const sessionId = this.normalizeSessionId(rawSessionId);
    const session = this.sessionsById.get(sessionId);
    if (!session) {
      return {
        status: "not_found",
        message: "Session not found.",
      };
    }
    if (session.hostUserId !== hostUserId) {
      return {
        status: "forbidden",
        message: "Only the host can approve join requests.",
      };
    }
    const request = session.pendingJoinRequests.get(participantUserId);
    if (!request) {
      return {
        status: "missing_request",
        message: "Join request not found.",
      };
    }

    session.pendingJoinRequests.delete(participantUserId);
    if (!approved) {
      return {
        status: "rejected",
        message: "Join request rejected.",
        request,
      };
    }

    if (
      session.approvedParticipantUserId &&
      session.approvedParticipantUserId !== participantUserId
    ) {
      return {
        status: "consumed",
        message: "This one-time code has already been used.",
      };
    }

    session.approvedParticipantUserId = participantUserId;
    session.codeConsumed = true;
    return {
      status: "approved",
      message: "Join request approved.",
      request,
    };
  }

  joinApprovedParticipant(rawSessionId, user) {
    const sessionId = this.normalizeSessionId(rawSessionId);
    const session = this.sessionsById.get(sessionId);
    if (!session) {
      throw new Error("Session not found.");
    }
    if (this.isJoinCodeExpired(session)) {
      this.sessionsById.delete(sessionId);
      throw new Error("Session code has expired.");
    }
    if (session.hostUserId === user.userId) {
      this.setParticipantOnline(session, user);
      return this.toSnapshot(session);
    }
    if (session.approvedParticipantUserId !== user.userId) {
      throw new Error("Join request must be approved by host.");
    }

    this.setParticipantOnline(session, user);
    return this.toSnapshot(session);
  }

  leave(rawSessionId, userId) {
    const sessionId = this.normalizeSessionId(rawSessionId);
    const session = this.sessionsById.get(sessionId);
    if (!session) return null;

    const participant = session.participants.get(userId);
    if (participant) {
      if (userId !== session.hostUserId) {
        session.participants.delete(userId);
        session.progressByUser.delete(userId);
        session.pendingJoinRequests.delete(userId);
      } else {
        participant.online = false;
        participant.lastSeenAt = new Date().toISOString();
        session.participants.set(userId, participant);
      }
    }
    return this.toSnapshot(session, { includePendingRequests: true });
  }

  heartbeat(rawSessionId, userId) {
    const sessionId = this.normalizeSessionId(rawSessionId);
    const session = this.sessionsById.get(sessionId);
    if (!session) return null;

    const participant = session.participants.get(userId);
    if (!participant) return null;

    participant.online = true;
    participant.lastSeenAt = new Date().toISOString();
    session.participants.set(userId, participant);
    return this.toSnapshot(session, { includePendingRequests: true });
  }

  updateSelfProgress(rawSessionId, userId, progress) {
    const sessionId = this.normalizeSessionId(rawSessionId);
    const session = this.sessionsById.get(sessionId);
    if (!session) {
      throw new Error("Session not found.");
    }
    const participant = session.participants.get(userId);
    if (!participant) {
      throw new Error("Must join session before publishing progress");
    }
    session.progressByUser.set(userId, progress);
    return {
      sessionId: session.sessionId,
      workoutId: participant.workoutId,
      participantUserId: userId,
      progress,
    };
  }

  getSnapshot(rawSessionId) {
    const sessionId = this.normalizeSessionId(rawSessionId);
    const session = this.sessionsById.get(sessionId);
    if (!session) return null;
    return this.toSnapshot(session, { includePendingRequests: true });
  }

  createSession(sessionId, hostUserId) {
    const now = Date.now();
    const session = {
      sessionId,
      hostUserId,
      approvedParticipantUserId: null,
      codeConsumed: false,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.CODE_TTL_MS).toISOString(),
      expiresAtMs: now + this.CODE_TTL_MS,
      participants: new Map(),
      progressByUser: new Map(),
      pendingJoinRequests: new Map(),
    };
    this.sessionsById.set(sessionId, session);
    return session;
  }

  setParticipantOnline(session, user) {
    const now = new Date().toISOString();
    session.participants.set(user.userId, {
      userId: user.userId,
      displayName: user.displayName || `User ${user.userId}`,
      workoutId: user.workoutId,
      online: true,
      lastSeenAt: now,
    });
  }

  isJoinCodeExpired(session) {
    if (session.codeConsumed) return false;
    return Date.now() > session.expiresAtMs;
  }

  toSnapshot(session, options = {}) {
    const includePendingRequests = options.includePendingRequests === true;
    return {
      sessionId: session.sessionId,
      hostUserId: session.hostUserId,
      codeConsumed: session.codeConsumed,
      expiresAt: session.expiresAt,
      participants: Array.from(session.participants.values()),
      progressByUser: Object.fromEntries(session.progressByUser),
      createdAt: session.createdAt,
      pendingJoinRequests: includePendingRequests
        ? Array.from(session.pendingJoinRequests.values())
        : [],
    };
  }
}

module.exports = new WorkoutSessionStore();
