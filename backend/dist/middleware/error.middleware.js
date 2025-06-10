"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.notFoundHandler = exports.asyncHandler = exports.errorHandler = void 0;
const http_status_codes_1 = require("http-status-codes");
const logger_1 = require("../utils/logger");
const api_error_1 = require("../utils/api-error");
/**
 * Error handling middleware for the Express application.
 * This middleware catches all errors thrown in routes and sends an appropriate response.
 */
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    // Log the error for debugging
    logger_1.logger.error(`[${new Date().toISOString()}] Error: ${err.message}`);
    logger_1.logger.error(err.stack);
    // Handle validation errors from express-validator
    if (Array.isArray(err) && err.some(e => e.msg instanceof Error)) {
        const validationErrors = err.map(e => ({
            param: e.param,
            msg: e.msg.message || e.msg,
            location: e.location,
        }));
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Validation error',
            errors: validationErrors,
        });
        return;
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: 'Invalid or expired token',
        });
        return;
    }
    // Handle Prisma errors
    if (err.name === 'PrismaClientKnownRequestError' ||
        err.name === 'PrismaClientValidationError' ||
        err.name === 'PrismaClientInitializationError') {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Database error',
            error: process.env.NODE_ENV === 'development' ? err.message : 'A database error occurred',
        });
        return;
    }
    // Handle custom API errors
    if (err instanceof api_error_1.ApiError) {
        const response = {
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
    res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
/**
 * Wrapper function to handle async/await errors in Express routes
 */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
exports.asyncHandler = asyncHandler;
/**
 * Middleware to handle 404 Not Found errors
 */
const notFoundHandler = (req, res) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        message: `Cannot ${req.method} ${req.originalUrl}`,
    });
};
exports.notFoundHandler = notFoundHandler;
/**
 * Middleware to validate request using express-validator
 */
const validateRequest = (req, res, next) => {
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
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Validation error',
            errors,
        });
        return;
    }
    next();
};
exports.validateRequest = validateRequest;
