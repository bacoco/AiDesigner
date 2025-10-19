import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from 'dotenv';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { logger } from './config/logger';
import { initializeSocketIO, closeSocketIO } from './config/socketio';
import { projectService } from './services/projectService';
import { createHealthRouter } from './routes/health';

config();

const PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 3000;
if (Number.isNaN(PORT)) {
  throw new Error(`Invalid API_PORT: ${process.env.API_PORT}`);
}

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use(createHealthRouter());

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

const gracefulShutdown = (signal: NodeJS.Signals) => {
  logger.info(`${signal} received, beginning graceful shutdown`, { signal });

  const configuredTimeout = Number(process.env.SHUTDOWN_TIMEOUT_MS);
  const shutdownTimeout = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 30_000;

  const shutdownTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out, exiting forcefully');
    process.exit(1);
  }, shutdownTimeout);

  shutdownTimer.unref?.();

  closeSocketIO();
  projectService.shutdown();

  httpServer.close((error) => {
    clearTimeout(shutdownTimer);

    if (error) {
      logger.error('Error during HTTP server shutdown', { error: error.message, stack: error.stack });
      process.exit(1);
    }

    logger.info('Server closed gracefully');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});
