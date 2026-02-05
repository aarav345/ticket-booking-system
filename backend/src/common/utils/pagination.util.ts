import type { PaginationResult } from '../types/pagination.interface.js';

export class PaginationUtil {
  static paginate(page: number = 1, limit: number = 10): PaginationResult {
    const parsedPage = Math.max(1, parseInt(String(page)));
    const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit))));
    const skip = (parsedPage - 1) * parsedLimit;

    return {
      skip,
      take: parsedLimit,
      page: parsedPage,
      limit: parsedLimit,
    };
  }
}
