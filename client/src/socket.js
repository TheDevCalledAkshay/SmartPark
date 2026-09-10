import { io } from 'socket.io-client';

let socket = null;

// Singleton — one shared connection, reused by every component
export function getSocket() {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}
