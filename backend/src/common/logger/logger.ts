import pino from 'pino';
import type { Request, Response, NextFunction } from 'express';

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),

  // Pretty print in development
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
          messageFormat: '{correlationId} {msg}',
        },
      }
    : undefined,

  // Production format - JSON for log aggregation systems
  formatters: isProduction
    ? {
        level: label => {
          return { level: label };
        },
      }
    : undefined,

  // Base fields for all logs
  base: {
    env: process.env.NODE_ENV ?? 'development',
    service: 'ticket-booking-system-api',
  },

  // Serialize errors properly
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

// Generate unique correlation ID
export const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Request logging middleware with correlation ID
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate or use existing correlation ID
  const correlationId =
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    generateCorrelationId();

  // Store correlation ID in request for later use
  req.correlationId = correlationId;

  // Create child logger with correlation ID
  req.logger = logger.child({ correlationId });

  // Set correlation ID in response headers
  res.setHeader('X-Correlation-Id', correlationId);

  // Log request start
  req.logger.info(
    {
      type: 'request_start',
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    'Incoming request'
  );

  // Capture start time
  const startTime = Date.now();

  // Log response
  const originalSend = res.send;
  res.send = function (data): Response {
    const duration = Date.now() - startTime;

    req.logger.info(
      {
        type: 'request_end',
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
      },
      `Request completed in ${duration}ms`
    );

    return originalSend.call(this, data);
  };

  // Handle errors
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      const duration = Date.now() - startTime;
      req.logger.warn(
        {
          type: 'request_error',
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
        },
        `Request failed with status ${res.statusCode}`
      );
    }
  });

  next();
};

// Utility function to log with correlation ID from request
export const logWithCorrelation = (req: Request) => {
  return req.logger || logger;
};

export default logger;
