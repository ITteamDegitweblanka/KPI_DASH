"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
const http_status_codes_1 = require("http-status-codes");
class ApiError extends Error {
    constructor(statusCode, message, isOperational = true, errors, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errors = errors;
        if (stack) {
            this.stack = stack;
        }
        else if (isOperational) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    // Common error types
    static badRequest(message, errors) {
        return new ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, message, true, errors);
    }
    static unauthorized(message = 'Unauthorized') {
        return new ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, message);
    }
    static forbidden(message = 'Forbidden') {
        return new ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, message);
    }
    static notFound(message = 'Resource not found') {
        return new ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, message);
    }
    static conflict(message) {
        return new ApiError(http_status_codes_1.StatusCodes.CONFLICT, message);
    }
    static internal(message = 'Internal Server Error') {
        return new ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message, false);
    }
    static validationError(message = 'Validation Error', errors) {
        return new ApiError(http_status_codes_1.StatusCodes.UNPROCESSABLE_ENTITY, message, true, errors);
    }
}
exports.ApiError = ApiError;
// This utility class provides a consistent way to create and handle API errors throughout the application.
// It extends the native Error class and adds HTTP status codes and operational flags.
// The static methods provide a convenient way to create common error types with appropriate status codes.
