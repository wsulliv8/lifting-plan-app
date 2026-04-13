class WorkoutSessionStore {
  constructor() {
    this.sessionsByWorkoutId = new Map();
  }

  getOrCreate(workoutId) {
    let session = this.sessionsByWorkoutId.get(workoutId);
    if (!session) {
      session = {
        sessionId: `workout-${workoutId}`,
        workoutId,
        participants: new Map(),
        progressByUser: new Map(),
        createdAt: new Date().toISOString(),
      };
      this.sessionsByWorkoutId.set(workoutId, session);
    }
    return session;
  }

  join(workoutId, user) {
    const session = this.getOrCreate(workoutId);
    const now = new Date().toISOString();
    session.participants.set(user.userId, {
      userId: user.userId,
      displayName: user.displayName || `User ${user.userId}`,
      online: true,
      lastSeenAt: now,
    });
    return this.toSnapshot(session);
  }

  leave(workoutId, userId) {
    const session = this.sessionsByWorkoutId.get(workoutId);
    if (!session) return null;

    const participant = session.participants.get(userId);
    if (participant) {
      participant.online = false;
      participant.lastSeenAt = new Date().toISOString();
      session.participants.set(userId, participant);
    }
    return this.toSnapshot(session);
  }

  heartbeat(workoutId, userId) {
    const session = this.sessionsByWorkoutId.get(workoutId);
    if (!session) return null;

    const participant = session.participants.get(userId);
    if (!participant) return null;

    participant.online = true;
    participant.lastSeenAt = new Date().toISOString();
    session.participants.set(userId, participant);
    return this.toSnapshot(session);
  }

  updateSelfProgress(workoutId, userId, progress) {
    const session = this.getOrCreate(workoutId);
    if (!session.participants.has(userId)) {
      throw new Error("Must join session before publishing progress");
    }
    session.progressByUser.set(userId, progress);
    return {
      sessionId: session.sessionId,
      workoutId: session.workoutId,
      participantUserId: userId,
      progress,
    };
  }

  getSnapshot(workoutId) {
    const session = this.sessionsByWorkoutId.get(workoutId);
    if (!session) return null;
    return this.toSnapshot(session);
  }

  toSnapshot(session) {
    return {
      sessionId: session.sessionId,
      workoutId: session.workoutId,
      participants: Array.from(session.participants.values()),
      progressByUser: Object.fromEntries(session.progressByUser),
      createdAt: session.createdAt,
    };
  }
}

module.exports = new WorkoutSessionStore();
