let ioRef = null;

export function setIo(io) {
  ioRef = io;
}

export function emitToEvent(eventId, event, payload) {
  ioRef?.to(`event:${eventId}`).emit(event, payload);
}

export function emitToUser(userId, event, payload) {
  ioRef?.to(`user:${userId}`).emit(event, payload);
}

