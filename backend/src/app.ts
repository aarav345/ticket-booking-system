import './common/types/express';
import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import corsConfig from './config/cors.config.js';
import { errorHandler } from './common/middlewares/error-handler.middleware';
import { notFound } from './common/middlewares/notFound.middleware';
import { requestLogger, logger } from './common/logger/logger';
import healthRoutes from './health/health.route';
import routes from './routes/index';

const app: Application = express();

// Trust proxy - important for getting correct IP addresses behind reverse proxies
app.set('trust proxy', 1);

// Request logging middleware
app.use(requestLogger);

// Security middlewares
app.use(helmet());
app.use(cors(corsConfig));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check routes
app.use('/health', healthRoutes);

// Compression
app.use(compression());

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Log application startup
logger.info(
  {
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  },
  'Application initialized'
);

export default app;
