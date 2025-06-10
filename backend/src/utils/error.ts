import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: any[];

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    errors?: any[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (err: any, res: Response) => {
  const { statusCode = 500, message, errors } = err;
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors })
  });
};

export const notFound = (entity: string) => {
  throw new ApiError(StatusCodes.NOT_FOUND, `${entity} not found`);
};

export const badRequest = (message: string) => {
  throw new ApiError(StatusCodes.BAD_REQUEST, message);
};

export const unauthorized = (message = 'Unauthorized') => {
  throw new ApiError(StatusCodes.UNAUTHORIZED, message);
};

export const forbidden = (message = 'Forbidden') => {
  throw new ApiError(StatusCodes.FORBIDDEN, message);
};
