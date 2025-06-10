import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/api-error';

/**
 * Error handling middleware for the Express application.
 * This middleware catches all errors thrown in routes and sends an appropriate response.
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // Log the error for debugging
  logger.error(`[${new Date().toISOString()}] Error: ${err.message}`);
  logger.error(err.stack);

  // Handle validation errors from express-validator
  if (Array.isArray(err) && err.some(e => e.msg instanceof Error)) {
    const validationErrors = err.map(e => ({
      param: e.param,
      msg: e.msg.message || e.msg,
      location: e.location,
    }));
    
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Validation error',
      errors: validationErrors,
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid or expired token',
    });
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError' || 
      err.name === 'PrismaClientValidationError' ||
      err.name === 'PrismaClientInitializationError') {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Database error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'A database error occurred',
    });
    return;
  }

  // Handle custom API errors
  if (err instanceof ApiError) {
    const response: any = {
      success: false,
      message: err.message,
    };

    if (err.errors && err.errors.length > 0) {
      response.errors = err.errors;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle all other errors
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Wrapper function to handle async/await errors in Express routes
 */
export const asyncHandler = (fn: Function) => 
  (req: Request, res: Response, next: NextFunction): Promise<void> => 
    Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Middleware to handle 404 Not Found errors
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Middleware to validate request using express-validator
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = [];
  
  // Check for validation errors
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    for (const key in req.body) {
      if (req.body[key] === '') {
        errors.push({
          param: key,
          msg: `${key} cannot be empty`,
          location: 'body',
        });
      }
    }
  }

  if (errors.length > 0) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Validation error',
      errors,
    });
    return;
  }

  next();
};