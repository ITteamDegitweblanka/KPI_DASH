import { NextFunction, Request, Response } from 'express';

// Extend the Express Request type to include paginationOptions
declare global {
  namespace Express {
    interface Request {
      paginationOptions: PaginationOptions;
    }
  }
}

export const paginationFields = ['page', 'limit', 'sortBy', 'sortOrder'] as const;

export type PaginationOptions = {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

export const getPaginationOptions = (query: Record<string, any>): PaginationOptions => ({
  page: query.page ? Math.max(1, parseInt(query.page as string, 10)) : 1,
  limit: query.limit ? Math.max(1, parseInt(query.limit as string, 10)) : 10,
  sortBy: (query.sortBy as string) || 'createdAt',
  sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
});

export const paginationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.paginationOptions = getPaginationOptions(req.query);
  next();
};
