// src/server.ts
import http from 'http';
import app from './app.js';
import { redisClient, pubSubClient } from './config/redis.js';
import { setupWebSocket } from './config/websocket.setup.js';
import { PORT, logger } from '@horizon/shared';

const start = async () => {
  const server = http.createServer(app);

  try {
    server.listen(PORT, '0.0.0.0', () => {
      setupWebSocket(server);
      logger.info(`HTTP + WebSocket server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.fatal({ err }, `Startup error`);
    process.exit(1);
  }

  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);

    // 1. Stop server from accepting new connections
    server.close(async (err) => {
      if (err) {
        logger.error({ err }, 'Error during server close');
      }

      // 2. Close Redis connections
      try {
        await Promise.all([redisClient.quit(), pubSubClient.quit()]);
        logger.info('Redis clients disconnected.');
      } catch (redisErr) {
        logger.error({ err: redisErr }, 'Error quitting Redis clients');
      }

      logger.info('Graceful shutdown complete.');
      process.exit(err ? 1 : 0);
    });

    // Force close after timeout if server hangs
    setTimeout(() => {
      logger.warn('Forceful shutdown after 10s timeout');
      process.exit(1);
    }, 10000);
  };
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

start().catch((err) => {
  logger.fatal({ err }, 'Unhandled exception during server startup');
  process.exit(1);
});
