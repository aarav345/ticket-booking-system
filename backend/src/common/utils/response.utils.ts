import type { Response } from 'express';
import type { PaginationMeta } from '../types/pagination.interface.js';

interface ErrorDetail {
  field: string;
  message: string;
  code?: string;
}

interface ErrorResponseOptions {
  errors?: ErrorDetail[];
  details?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}

export class ResponseUtil {
  static success<T>(
    res: Response,
    data: T | null = null,
    message: string = 'Success',
    statusCode: number = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static error(
    res: Response,
    message: string = 'Error',
    statusCode: number = 500,
    options?: ErrorResponseOptions
  ): void {
    const response: Record<string, unknown> = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    // Add errors if provided
    if (options?.errors) {
      response.errors = options.errors;
    }

    // Add details if provided
    if (options?.details) {
      response.details = options.details;
    }

    // Add stack trace only in development
    if (options?.stack && process.env.NODE_ENV === 'development') {
      response.stack = options.stack;
    }

    // Add any additional metadata
    if (options?.metadata) {
      Object.assign(response, options.metadata);
    }

    res.status(statusCode).json(response);
  }

  static validationError(
    res: Response,
    errors: ErrorDetail[],
    message: string = 'Validation failed'
  ): void {
    res.status(400).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  static databaseError(
    res: Response,
    message: string,
    statusCode: number = 500,
    details?: string
  ): void {
    const response: Record<string, unknown> = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (details) {
      response.details = details;
    }

    res.status(statusCode).json(response);
  }

  static notFound(
    res: Response,
    message: string = 'Resource not found',
    resource?: string,
    identifier?: string | number
  ): void {
    const finalMessage =
      resource && identifier
        ? `${resource} with identifier '${identifier}' not found`
        : resource
          ? `${resource} not found`
          : message;

    res.status(404).json({
      success: false,
      message: finalMessage,
      timestamp: new Date().toISOString(),
    });
  }

  static unauthorized(
    res: Response,
    message: string = 'Unauthorized access'
  ): void {
    res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  static forbidden(res: Response, message: string = 'Access forbidden'): void {
    res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  static conflict(res: Response, message: string, details?: string): void {
    const response: Record<string, unknown> = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (details) {
      response.details = details;
    }

    res.status(409).json(response);
  }

  static serviceUnavailable(
    res: Response,
    message: string = 'Service temporarily unavailable'
  ): void {
    res.status(503).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  static badRequest(
    res: Response,
    message: string = 'Bad request',
    details?: string
  ): void {
    const response: Record<string, unknown> = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (details) {
      response.details = details;
    }

    res.status(400).json(response);
  }

  static paginated<T>(
    res: Response,
    data: T,
    pagination: PaginationMeta,
    message: string = 'Success'
  ): void {
    res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
      },
      timestamp: new Date().toISOString(),
    });
  }
}
