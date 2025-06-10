"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamMembers = exports.deleteUser = exports.updateUserRole = exports.updateUser = exports.getUserById = exports.getCurrentUser = exports.getUsers = void 0;
const http_status_codes_1 = require("http-status-codes");
const prisma_1 = require("../utils/prisma");
const api_error_1 = require("../utils/api-error");
const error_middleware_1 = require("../middleware/error.middleware");
/**
 * Get all users with pagination and filtering
 */
exports.getUsers = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = { isActive: true };
    if (search) {
        const searchTerm = typeof search === 'string' ? search.toLowerCase() : String(search);
        where.OR = [
            { displayName: { contains: searchTerm } },
            { email: { contains: searchTerm } },
        ];
    }
    const [users, total] = await Promise.all([
        prisma_1.prisma.user.findMany({
            where,
            skip,
            take: Number(limit),
            select: {
                id: true,
                email: true,
                displayName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma_1.prisma.user.count({ where }),
    ]);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        data: users,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    });
});
/**
 * Get current user profile
 */
exports.getCurrentUser = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Not authenticated');
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
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
    res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: user });
});
/**
 * Get user by ID
 */
exports.getUserById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
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
    res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: user });
});
/**
 * Update user profile
 */
exports.updateUser = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { displayName, title, phoneNumber, avatarUrl } = req.body;
    const user = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            displayName,
            title,
            phoneNumber,
            avatarUrl,
        },
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            isActive: true,
            title: true,
            phoneNumber: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: user });
});
/**
 * Update user role (Super Admin only)
 */
exports.updateUserRole = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    // Check if user exists
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    // Check if the current user is a super admin
    if (req.user?.role !== 'SUPER_ADMIN') {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to update user role');
    }
    // Update user role
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: updatedUser });
});
/**
 * Delete user (Soft delete)
 */
exports.deleteUser = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    // Check if user exists
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    // Soft delete the user
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: 'User deleted successfully',
    });
});
/**
 * Get user's team members
 */
exports.getTeamMembers = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (!req.user?.teamId) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User is not part of a team');
    }
    const teamMembers = await prisma_1.prisma.user.findMany({
        where: {
            teamId: req.user.teamId,
            isActive: true,
            id: { not: req.user.id }, // Exclude the current user
        },
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            title: true,
            avatarUrl: true,
            phoneNumber: true,
            createdAt: true,
        },
        orderBy: { displayName: 'asc' },
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: teamMembers });
});
