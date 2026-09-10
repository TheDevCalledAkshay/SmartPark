let io = null;

export function setIO(instance) {
  io = instance;
}

export function getIO() {
  return io;
}

// Safe emit — does nothing if Socket.IO isn't initialised yet
export function broadcast(event, payload) {
  if (io) io.emit(event, payload);
}
