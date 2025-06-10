"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSuperAdmin = exports.isAdmin = exports.isTeamLeaderOrAdmin = exports.isOwnerOrAdmin = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = require("../config");
const api_error_1 = require("../utils/api-error");
const types_1 = require("../types");
const prisma_1 = require("../utils/prisma");
/**
 * Middleware to authenticate user using JWT
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        if (!token) {
            return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'No token provided'));
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        // Check if user still exists
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, isActive: true }
        });
        if (!user || !user.isActive) {
            return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'User no longer exists or is inactive'));
        }
        // Add user to request object
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid token'));
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Token expired'));
        }
        next(error);
    }
};
exports.authenticate = authenticate;
/**
 * Middleware to check if user has required roles
 */
const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Authentication required'));
        }
        if (roles.length && !roles.includes(req.user.role)) {
            return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, `User role ${req.user.role} is not authorized to access this route`));
        }
        next();
    };
};
exports.authorize = authorize;
/**
 * Middleware to check if user is the owner of the resource or has admin role
 */
const isOwnerOrAdmin = (paramName = 'id') => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Authentication required'));
        }
        // Allow admins to access any resource
        if (req.user.role === types_1.UserRole.ADMIN || req.user.role === types_1.UserRole.SUPER_ADMIN) {
            return next();
        }
        // Check if the requested resource ID matches the user's ID
        const resourceId = req.params[paramName];
        if (resourceId !== req.user.id) {
            return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'You do not have permission to access this resource'));
        }
        next();
    };
};
exports.isOwnerOrAdmin = isOwnerOrAdmin;
/**
 * Middleware to check if user is a team leader or admin
 */
const isTeamLeaderOrAdmin = async (req, res, next) => {
    if (!req.user) {
        return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Authentication required'));
    }
    // Allow admins to access any resource
    if (req.user.role === types_1.UserRole.ADMIN || req.user.role === types_1.UserRole.SUPER_ADMIN) {
        return next();
    }
    // Check if user is a team leader or sub-leader
    if (req.user.role !== types_1.UserRole.LEADER && req.user.role !== types_1.UserRole.SUB_LEADER) {
        return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'You must be a team leader or admin to access this resource'));
    }
    next();
};
exports.isTeamLeaderOrAdmin = isTeamLeaderOrAdmin;
/**
 * Middleware to check if user is an admin or super admin
 */
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Authentication required'));
    }
    if (req.user.role !== types_1.UserRole.ADMIN && req.user.role !== types_1.UserRole.SUPER_ADMIN) {
        return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'You must be an admin to access this resource'));
    }
    next();
};
exports.isAdmin = isAdmin;
/**
 * Middleware to check if user is a super admin
 */
const isSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Authentication required'));
    }
    if (req.user.role !== types_1.UserRole.SUPER_ADMIN) {
        return next(new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'You must be a super admin to access this resource'));
    }
    next();
};
exports.isSuperAdmin = isSuperAdmin;
