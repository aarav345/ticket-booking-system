import type { Response } from 'express';
import type { PaginationMeta } from '../types/pagination.interface.js';

export class ResponseUtil {
  static success<T>(
    res: Response,
    data: T | null = null,
    message: string = 'Success',
    statusCode: number = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      message: message,
      data: data,
      timestamp: new Date().toISOString(),
    });
  }

  static error(
    res: Response,
    message: string = 'Error',
    statusCode: number = 500,
    errors: unknown = null
  ): void {
    res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
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
