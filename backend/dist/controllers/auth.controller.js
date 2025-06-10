"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshToken = exports.getMe = exports.login = exports.register = exports.testConnection = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_status_codes_1 = require("http-status-codes");
const express_validator_1 = require("express-validator");
const config_1 = require("../config");
const prisma_1 = require("../utils/prisma");
const api_error_1 = require("../utils/api-error");
const error_middleware_1 = require("../middleware/error.middleware");
/**
 * Test endpoint to verify the connection
 */
exports.testConnection = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: 'Successfully connected to the backend API!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});
/**
 * Register a new user
 */
exports.register = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    // Validate request
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next(api_error_1.ApiError.validationError('Validation error', errors.array()));
    }
    const { email, password, displayName, role = 'Staff' } = req.body;
    // Check if user already exists
    const existingUser = await prisma_1.prisma.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.CONFLICT, 'Email already in use'));
    }
    // Hash password
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedPassword = await bcryptjs_1.default.hash(password, salt);
    // Create user
    const user = await prisma_1.prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            firstName: displayName.split(' ')[0],
            lastName: displayName.split(' ').slice(1).join(' ') || 'User',
            displayName,
            role,
            isActive: true,
        },
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
    });
    // Generate tokens
    const tokens = generateTokens(user.id, user.email, user.role);
    res.status(http_status_codes_1.StatusCodes.CREATED).json({
        success: true,
        data: {
            user,
            ...tokens,
        },
    });
});
/**
 * Login user
 */
exports.login = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    // Validate request
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next(api_error_1.ApiError.validationError('Validation error', errors.array()));
    }
    const { email, password } = req.body;
    console.log('[LOGIN DEBUG] Attempting login for:', email);
    // Check if user exists
    const user = await prisma_1.prisma.user.findUnique({
        where: { email },
    });
    console.log('[LOGIN DEBUG] User found:', !!user, user && { email: user.email, role: user.role, isActive: user.isActive });
    if (!user) {
        console.log('[LOGIN DEBUG] User not found:', email);
        return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid email or password'));
    }
    const passwordMatch = await bcryptjs_1.default.compare(password, user.password);
    console.log('[LOGIN DEBUG] Password match:', passwordMatch);
    if (!passwordMatch) {
        console.log('[LOGIN DEBUG] Password mismatch for:', email);
        return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid email or password'));
    }
    // Check if user is active
    if (!user.isActive) {
        return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'Account is deactivated'));
    }
    // Generate tokens
    const tokens = generateTokens(user.id, user.email, user.role);
    // Update last login
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
    });
    const response = {
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                isActive: user.isActive,
            },
            ...tokens,
        },
    };
    console.log('[LOGIN DEBUG] Sending response:', JSON.stringify(response, null, 2));
    res.status(http_status_codes_1.StatusCodes.OK).json(response);
});
/**
 * Get current user profile
 */
exports.getMe = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user?.id },
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            isActive: true,
            title: true,
            phoneNumber: true,
            avatarUrl: true,
            team: {
                select: {
                    id: true,
                    name: true,
                    branch: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!user) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        data: user,
    });
});
/**
 * Refresh access token
 */
exports.refreshToken = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Refresh token is required'));
    }
    try {
        // Verify refresh token
        const decoded = jsonwebtoken_1.default.verify(refreshToken, config_1.config.jwt.secret);
        // Check if user exists and is active
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, isActive: true },
        });
        if (!user || !user.isActive) {
            return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'User not found or inactive'));
        }
        // Generate new tokens
        const tokens = generateTokens(user.id, user.email, user.role);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: tokens,
        });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid refresh token'));
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Refresh token expired'));
        }
        next(error);
    }
});
/**
 * Logout user (client should delete the token)
 */
exports.logout = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    // In a real application, you might want to implement token blacklisting here
    // For JWT, since they are stateless, we just inform the client to delete the token
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: 'Successfully logged out',
    });
});
/**
 * Generate JWT tokens
 */
const generateTokens = (userId, email, role) => {
    const accessToken = jsonwebtoken_1.default.sign({ id: userId, email, role }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.accessExpirationMinutes * 60 } // in seconds
    );
    const refreshToken = jsonwebtoken_1.default.sign({ id: userId, email, role }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.refreshExpirationDays * 24 * 60 * 60 } // in seconds
    );
    return {
        accessToken,
        refreshToken,
        expiresIn: config_1.config.jwt.accessExpirationMinutes * 60, // in seconds
    };
};
