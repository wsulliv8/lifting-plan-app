class WorkoutSessionStore {
  constructor() {
    this.sessionsById = new Map();
  }

  getOrCreate(sessionId) {
    let session = this.sessionsById.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        participants: new Map(),
        progressByUser: new Map(),
        createdAt: new Date().toISOString(),
      };
      this.sessionsById.set(sessionId, session);
    }
    return session;
  }

  join(sessionId, user) {
    const session = this.getOrCreate(sessionId);
    const now = new Date().toISOString();
    session.participants.set(user.userId, {
      userId: user.userId,
      displayName: user.displayName || `User ${user.userId}`,
      workoutId: user.workoutId,
      online: true,
      lastSeenAt: now,
    });
    return this.toSnapshot(session);
  }

  leave(sessionId, userId) {
    const session = this.sessionsById.get(sessionId);
    if (!session) return null;

    const participant = session.participants.get(userId);
    if (participant) {
      participant.online = false;
      participant.lastSeenAt = new Date().toISOString();
      session.participants.set(userId, participant);
    }
    return this.toSnapshot(session);
  }

  heartbeat(sessionId, userId) {
    const session = this.sessionsById.get(sessionId);
    if (!session) return null;

    const participant = session.participants.get(userId);
    if (!participant) return null;

    participant.online = true;
    participant.lastSeenAt = new Date().toISOString();
    session.participants.set(userId, participant);
    return this.toSnapshot(session);
  }

  updateSelfProgress(sessionId, userId, progress) {
    const session = this.getOrCreate(sessionId);
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

  getSnapshot(sessionId) {
    const session = this.sessionsById.get(sessionId);
    if (!session) return null;
    return this.toSnapshot(session);
  }

  toSnapshot(session) {
    return {
      sessionId: session.sessionId,
      participants: Array.from(session.participants.values()),
      progressByUser: Object.fromEntries(session.progressByUser),
      createdAt: session.createdAt,
    };
  }
}

module.exports = new WorkoutSessionStore();
