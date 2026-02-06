import type { Request, Response, NextFunction } from 'express';
import type { ValidatedRequest } from '../middlewares/validation.middleware.js';

type AsyncRequestHandler<
  TBody = undefined,
  TQuery = undefined,
  TParams = undefined,
> = (
  req: ValidatedRequest<TBody, TQuery, TParams>,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const asyncHandler = <
  TBody = undefined,
  TQuery = undefined,
  TParams = undefined,
>(
  fn: AsyncRequestHandler<TBody, TQuery, TParams>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(
      fn(req as ValidatedRequest<TBody, TQuery, TParams>, res, next)
    ).catch(next);
  };
};
