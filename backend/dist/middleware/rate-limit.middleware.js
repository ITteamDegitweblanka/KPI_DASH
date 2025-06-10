"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.apiLimiter = exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const api_error_1 = require("../utils/api-error");
const http_status_codes_1 = require("http-status-codes");
/**
 * Rate limiting middleware to prevent abuse
 * @param windowMs - Time window in milliseconds
 * @param max - Maximum number of requests allowed in the window
 * @returns Rate limit middleware
 */
const rateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
    return (0, express_rate_limit_1.default)({
        windowMs, // 15 minutes by default
        max, // Limit each IP to 100 requests per windowMs
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        handler: (req, res, next) => {
            next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.TOO_MANY_REQUESTS, 'Too many requests, please try again later.'));
        }
    });
};
exports.rateLimiter = rateLimiter;
exports.apiLimiter = (0, exports.rateLimiter)(15 * 60 * 1000, 100); // 100 requests per 15 minutes
exports.authLimiter = (0, exports.rateLimiter)(15 * 60 * 1000, 20); // 20 requests per 15 minutes for auth routes
