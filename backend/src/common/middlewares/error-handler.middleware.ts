import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  AlreadyExistsError,
  DatabaseError,
  ConflictError,
  ServiceUnavailableError,
  BadRequestError,
} from '../errors/app.error';
import { ResponseUtil } from '../utils/response.utils';
import { logWithCorrelation } from '../logger/logger';

interface ZodValidationError {
  field: string;
  message: string;
  code: string;
}

interface PostgresError extends Error {
  code?: string;
  detail?: string;
  constraint?: string;
  column?: string;
  table?: string;
  severity?: string;
}

function isPostgresError(error: unknown): error is PostgresError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'severity' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const logger = logWithCorrelation(req);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors: ZodValidationError[] = err.issues.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code,
    }));

    logger.warn(
      {
        type: 'validation_error',
        path: req.path,
        method: req.method,
        errors,
      },
      'Validation error occurred'
    );

    return ResponseUtil.validationError(res, errors);
  }

  // Handle custom ValidationError from AppError
  if (err instanceof ValidationError) {
    logger.warn(
      {
        type: 'custom_validation_error',
        path: req.path,
        method: req.method,
        errors: err.errors,
      },
      'Custom validation error occurred'
    );

    if (err.errors && Array.isArray(err.errors)) {
      return ResponseUtil.validationError(res, err.errors, err.message);
    }

    return ResponseUtil.badRequest(res, err.message);
  }

  // Handle NotFoundError
  if (err instanceof NotFoundError) {
    logger.warn(
      {
        type: 'not_found_error',
        path: req.path,
        method: req.method,
        message: err.message,
        resource: err.resource,
        identifier: err.identifier,
      },
      'Resource not found'
    );

    return ResponseUtil.notFound(
      res,
      err.message,
      err.resource,
      err.identifier
    );
  }

  // Handle UnauthorizedError
  if (err instanceof UnauthorizedError) {
    logger.warn(
      {
        type: 'unauthorized_error',
        path: req.path,
        method: req.method,
        message: err.message,
      },
      'Unauthorized access attempt'
    );

    return ResponseUtil.unauthorized(res, err.message);
  }

  // Handle ForbiddenError
  if (err instanceof ForbiddenError) {
    logger.warn(
      {
        type: 'forbidden_error',
        path: req.path,
        method: req.method,
        message: err.message,
      },
      'Forbidden access attempt'
    );

    return ResponseUtil.forbidden(res, err.message);
  }

  // Handle AlreadyExistsError and ConflictError
  if (err instanceof AlreadyExistsError || err instanceof ConflictError) {
    logger.warn(
      {
        type: 'conflict_error',
        path: req.path,
        method: req.method,
        message: err.message,
        details: err.details,
      },
      'Conflict error occurred'
    );

    return ResponseUtil.conflict(res, err.message, err.details);
  }

  // Handle DatabaseError
  if (err instanceof DatabaseError) {
    logger.error(
      {
        type: 'database_error',
        path: req.path,
        method: req.method,
        message: err.message,
        details: err.details,
        statusCode: err.statusCode,
      },
      'Database error occurred'
    );

    return ResponseUtil.databaseError(
      res,
      err.message,
      err.statusCode,
      err.details
    );
  }

  // Handle ServiceUnavailableError
  if (err instanceof ServiceUnavailableError) {
    logger.error(
      {
        type: 'service_unavailable',
        path: req.path,
        method: req.method,
        message: err.message,
      },
      'Service unavailable'
    );

    return ResponseUtil.serviceUnavailable(res, err.message);
  }

  // Handle BadRequestError
  if (err instanceof BadRequestError) {
    logger.warn(
      {
        type: 'bad_request_error',
        path: req.path,
        method: req.method,
        message: err.message,
        details: err.details,
      },
      'Bad request error occurred'
    );

    return ResponseUtil.badRequest(res, err.message, err.details);
  }

  // Handle PostgreSQL errors
  if (isPostgresError(err)) {
    switch (err.code) {
      case '23505': // unique_violation
        logger.warn(
          {
            type: 'postgres_unique_violation',
            path: req.path,
            method: req.method,
            constraint: err.constraint,
            detail: err.detail,
            code: err.code,
          },
          'Duplicate entry detected'
        );
        return ResponseUtil.conflict(
          res,
          'Duplicate entry',
          err.detail ?? 'Resource already exists'
        );

      case '23503': // foreign_key_violation
        logger.warn(
          {
            type: 'postgres_foreign_key_violation',
            path: req.path,
            method: req.method,
            constraint: err.constraint,
            detail: err.detail,
            code: err.code,
          },
          'Foreign key constraint violation'
        );
        return ResponseUtil.databaseError(
          res,
          'Foreign key constraint failed',
          400,
          err.detail ?? 'Referenced resource does not exist'
        );

      case '23502': // not_null_violation
        logger.warn(
          {
            type: 'postgres_not_null_violation',
            path: req.path,
            method: req.method,
            column: err.column,
            code: err.code,
          },
          'Not null constraint violation'
        );
        return ResponseUtil.databaseError(
          res,
          'Required field missing',
          400,
          err.column
            ? `Field '${err.column}' is required`
            : 'Required field missing'
        );

      case '23514': // check_violation
        logger.warn(
          {
            type: 'postgres_check_violation',
            path: req.path,
            method: req.method,
            constraint: err.constraint,
            detail: err.detail,
            code: err.code,
          },
          'Check constraint violation'
        );
        return ResponseUtil.databaseError(
          res,
          'Data validation failed',
          400,
          err.detail ?? 'Invalid data provided'
        );

      case '42P01': // undefined_table
        logger.error(
          {
            type: 'postgres_undefined_table',
            path: req.path,
            method: req.method,
            detail: err.detail,
            code: err.code,
          },
          'Database table not found'
        );
        return ResponseUtil.error(res, 'Internal server error', 500);

      case '08006': // connection_failure
      case '08003': // connection_does_not_exist
        logger.error(
          {
            type: 'postgres_connection_error',
            path: req.path,
            method: req.method,
            code: err.code,
          },
          'Database connection error'
        );
        return ResponseUtil.serviceUnavailable(res);

      case '40001': // serialization_failure
        logger.warn(
          {
            type: 'postgres_serialization_failure',
            path: req.path,
            method: req.method,
            code: err.code,
          },
          'Transaction serialization failure'
        );
        return ResponseUtil.conflict(
          res,
          'Concurrent transaction conflict, please retry'
        );

      case '55P03': // lock_not_available
        logger.warn(
          {
            type: 'postgres_lock_unavailable',
            path: req.path,
            method: req.method,
            code: err.code,
          },
          'Database lock not available'
        );
        return ResponseUtil.conflict(
          res,
          'Resource is currently being modified, please retry'
        );

      default:
        logger.error(
          {
            type: 'postgres_error',
            path: req.path,
            method: req.method,
            code: err.code,
            detail: err.detail,
            message: err.message,
          },
          'PostgreSQL error occurred'
        );
        return ResponseUtil.databaseError(
          res,
          process.env.NODE_ENV === 'production'
            ? 'Database operation failed'
            : err.message,
          500,
          process.env.NODE_ENV === 'development' ? err.detail : undefined
        );
    }
  }

  // Handle generic AppError (must be checked after specific error types)
  if (err instanceof AppError) {
    const statusCode = err.statusCode || 500;

    // Log based on severity
    if (statusCode >= 500) {
      logger.error(
        {
          type: 'application_error',
          statusCode,
          message: err.message,
          path: req.path,
          method: req.method,
          details: err.details,
          err, // Pino will serialize this using stdSerializers.err
        },
        'Application error occurred'
      );
    } else {
      logger.warn(
        {
          type: 'application_warning',
          statusCode,
          message: err.message,
          path: req.path,
          method: req.method,
          details: err.details,
        },
        'Application warning'
      );
    }

    return ResponseUtil.error(res, err.message, statusCode, {
      details: err.details,
      stack: err.stack,
      metadata: err.metadata,
    });
  }

  // Handle unexpected errors
  const errorWithStatus = err as Error & { statusCode?: number };
  const statusCode =
    typeof errorWithStatus.statusCode === 'number'
      ? errorWithStatus.statusCode
      : 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  logger.error(
    {
      type: 'unexpected_error',
      statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
      err, // Pino will serialize this with stack trace
    },
    'Unexpected error occurred'
  );

  return ResponseUtil.error(res, message, statusCode, {
    stack: err.stack,
  });
};
