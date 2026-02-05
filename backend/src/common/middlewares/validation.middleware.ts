import type { Request, Response, NextFunction } from 'express';
import type { z } from 'zod';
import { ResponseUtil } from '../utils/response.utils.js';
import { logWithCorrelation } from '../logger/logger.js';

export interface ValidatedRequest<
  TBody = undefined,
  TQuery = undefined,
  TParams = undefined,
> extends Request {
  validatedBody: TBody;
  validatedQuery: TQuery;
  validatedParams: TParams;
}

interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

export const validate =
  <T extends z.ZodSchema>(schema: T) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const logger = logWithCorrelation(req);
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors: ValidationErrorDetail[] = result.error.issues.map(
        issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })
      );

      logger.warn(
        {
          type: 'body_validation_error',
          path: req.path,
          method: req.method,
          errors,
        },
        'Request body validation failed'
      );

      return ResponseUtil.validationError(res, errors);
    }

    (req as ValidatedRequest<z.infer<T>>).validatedBody = result.data;
    next();
  };

export const validateQuery =
  <T extends z.ZodSchema>(schema: T) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const logger = logWithCorrelation(req);
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors: ValidationErrorDetail[] = result.error.issues.map(
        issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })
      );

      logger.warn(
        {
          type: 'query_validation_error',
          path: req.path,
          method: req.method,
          errors,
        },
        'Request query validation failed'
      );

      return ResponseUtil.validationError(res, errors);
    }

    (req as ValidatedRequest<undefined, z.infer<T>>).validatedQuery =
      result.data;
    next();
  };

export const validateParams =
  <T extends z.ZodSchema>(schema: T) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const logger = logWithCorrelation(req);
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors: ValidationErrorDetail[] = result.error.issues.map(
        issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })
      );

      logger.warn(
        {
          type: 'params_validation_error',
          path: req.path,
          method: req.method,
          errors,
        },
        'Request params validation failed'
      );

      return ResponseUtil.validationError(res, errors);
    }

    (
      req as ValidatedRequest<undefined, undefined, z.infer<T>>
    ).validatedParams = result.data;
    next();
  };
