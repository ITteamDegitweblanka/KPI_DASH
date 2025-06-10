import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { ApiError } from '../utils/api-error';
import { StatusCodes } from 'http-status-codes';

/**
 * Rate limiting middleware to prevent abuse
 * @param windowMs - Time window in milliseconds
 * @param max - Maximum number of requests allowed in the window
 * @returns Rate limit middleware
 */
export const rateLimiter = (windowMs = 15 * 60 * 1000, max = 100): RateLimitRequestHandler => {
  return rateLimit({
    windowMs, // 15 minutes by default
    max, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next) => {
      next(new ApiError(StatusCodes.TOO_MANY_REQUESTS, 'Too many requests, please try again later.'));
    }
  });
};

export const apiLimiter = rateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes

export const authLimiter = rateLimiter(15 * 60 * 1000, 20); // 20 requests per 15 minutes for auth routes
