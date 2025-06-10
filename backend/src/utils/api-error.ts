import { StatusCodes } from 'http-status-codes';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: any[];

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    errors?: any[],
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else if (isOperational) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Common error types
  public static badRequest(message: string, errors?: any[]): ApiError {
    return new ApiError(StatusCodes.BAD_REQUEST, message, true, errors);
  }

  public static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(StatusCodes.UNAUTHORIZED, message);
  }

  public static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(StatusCodes.FORBIDDEN, message);
  }

  public static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(StatusCodes.NOT_FOUND, message);
  }

  public static conflict(message: string): ApiError {
    return new ApiError(StatusCodes.CONFLICT, message);
  }

  public static internal(message = 'Internal Server Error'): ApiError {
    return new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, message, false);
  }

  public static validationError(message = 'Validation Error', errors: any[]): ApiError {
    return new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, message, true, errors);
  }
}

// This utility class provides a consistent way to create and handle API errors throughout the application.
// It extends the native Error class and adds HTTP status codes and operational flags.
// The static methods provide a convenient way to create common error types with appropriate status codes.