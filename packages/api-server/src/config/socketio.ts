import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export function initializeSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });
  
  return io;
}

export function getSocketIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocketIO first.');
  }
  return io;
}
