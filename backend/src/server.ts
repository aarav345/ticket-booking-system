import { configDotenv } from 'dotenv';
configDotenv();

import type { Server } from 'http';
import app from './app';
import { logger } from './common/logger/logger';
import { pool } from './database/pg.client';

const PORT = process.env.PORT ?? 3000;

let server: Server | undefined;

// Graceful shutdown function
const gracefulShutdown = (signal: string) => {
  logger.info({ signal }, `${signal} received, starting graceful shutdown`);

  // Stop accepting new connections
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Close database connection pool
        await pool.end();
        logger.info('Database connection pool closed');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error({ err: error }, 'Error during graceful shutdown');
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

// Start server
const startServer = async () => {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      logger.info('Database connected successfully');
    } finally {
      client.release();
    }

    server = app.listen(PORT, () => {
      logger.info(
        {
          port: PORT,
          env: process.env.NODE_ENV,
          nodeVersion: process.version,
        },
        `Server is running on port ${PORT}`
      );
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error({ port: PORT }, `Port ${PORT} is already in use`);
      } else {
        logger.error({ err: error }, 'Server error');
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  process.exit(1);
});

// Handle unhandled promise rejections
process.on(
  'unhandledRejection',
  (reason: unknown, promise: Promise<unknown>) => {
    logger.fatal(
      {
        reason,
        promise,
      },
      'Unhandled promise rejection'
    );
    process.exit(1);
  }
);

// Start the server
await startServer();

export default server;
