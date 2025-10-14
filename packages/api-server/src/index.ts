import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from 'dotenv';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { logger } from './config/logger';
import { initializeSocketIO } from './config/socketio';

config();

const PORT = process.env.API_PORT || 3000;

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

setupRoutes(app);

app.use(errorHandler);

const httpServer = createServer(app);
const io = initializeSocketIO(httpServer);

io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`);
  });
  
  socket.on('join-project', (projectId: string) => {
    socket.join(`project:${projectId}`);
    logger.info(`Client ${socket.id} joined project ${projectId}`);
  });
  
  socket.on('leave-project', (projectId: string) => {
    socket.leave(`project:${projectId}`);
    logger.info(`Client ${socket.id} left project ${projectId}`);
  });
});

httpServer.listen(PORT, () => {
  logger.info(`API server listening on port ${PORT}`);
  logger.info('WebSocket server attached to API server');
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
