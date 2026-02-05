export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public details?: string,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message: string = 'Resource not found',
    public resource?: string,
    public identifier?: string | number
  ) {
    super(message, 404);
  }
}

export class AlreadyExistsError extends AppError {
  constructor(message: string = 'Resource already exists', details?: string) {
    super(message, 409, true, details);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    public errors?: Array<{
      field: string;
      message: string;
      code?: string;
    }>
  ) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403);
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string = 'Database operation failed',
    statusCode: number = 500,
    details?: string
  ) {
    super(message, statusCode, true, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict occurred', details?: string) {
    super(message, 409, true, details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: string) {
    super(message, 400, true, details);
  }
}
