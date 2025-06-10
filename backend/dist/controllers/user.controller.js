"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAdminUser = exports.getAdminUsers = exports.getTeamMembers = exports.deleteUser = exports.updateUserRole = exports.updateUser = exports.getUserById = exports.getCurrentUser = exports.getUsers = void 0;
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
    // Prevent changing role of the last Super Admin
    if (user.role === 'SUPER_ADMIN') {
        const superAdminCount = await prisma_1.prisma.user.count({
            where: { role: 'SUPER_ADMIN' },
        });
        if (superAdminCount <= 1) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Cannot change role of the last Super Admin');
        }
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
    // Prevent deleting the last Super Admin
    if (user.role === 'SUPER_ADMIN') {
        const superAdminCount = await prisma_1.prisma.user.count({
            where: { role: 'SUPER_ADMIN' },
        });
        if (superAdminCount <= 1) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Cannot delete the last Super Admin');
        }
    }
    // Soft delete user
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            isActive: false,
            email: `deleted-${Date.now()}-${user.email}`, // De-anonymize email
        },
    });
    res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
});
/**
 * Get all team members for the current user's team
 */
exports.getTeamMembers = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Not authenticated');
    }
    const { id: userId, role, teamId } = req.user;
    if (!['LEADER', 'SUB_LEADER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'Only team leaders, sub-leaders, and admins can view team members');
    }
    const where = {
        isActive: true,
    };
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role) && teamId) {
        where.teamId = teamId;
        where.role = {
            in: ['MEMBER', 'LEADER', 'SUB_LEADER'],
        };
    }
    const teamMembers = await prisma_1.prisma.user.findMany({
        where,
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            title: true,
            phoneNumber: true,
            avatarUrl: true,
            isActive: true,
            createdAt: true,
        },
        orderBy: { displayName: 'asc' },
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: teamMembers });
});
/**
 * Get all admin users (Admin and Super Admin)
 */
exports.getAdminUsers = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const admins = await prisma_1.prisma.user.findMany({
        where: {
            role: {
                in: ['ADMIN', 'SUPER_ADMIN']
            },
            isActive: true
        },
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: { role: 'desc' } // SUPER_ADMIN first, then ADMIN
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: admins });
});
/**
 * Add a new admin user
 */
exports.addAdminUser = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { email, role = 'ADMIN' } = req.body;
    // Validate role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid admin role');
    }
    // Check if user already exists
    const existingUser = await prisma_1.prisma.user.findUnique({
        where: { email }
    });
    if (existingUser) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.CONFLICT, 'User already exists');
    }
    // Create new admin user
    const adminUser = await prisma_1.prisma.user.create({
        data: {
            email,
            firstName: email.split('@')[0],
            lastName: 'Admin',
            displayName: email.split('@')[0],
            role,
            isActive: true,
            // Generate a random password that needs to be reset
            password: require('crypto').randomBytes(16).toString('hex'),
            // Set default values for required fields
            title: 'Administrator',
            phoneNumber: '',
            avatarUrl: '',
            teamId: null
        },
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            isActive: true,
            createdAt: true
        }
    });
    // TODO: Send password reset email to the new admin
    res.status(http_status_codes_1.StatusCodes.CREATED).json({
        success: true,
        data: adminUser,
        message: 'Admin user created successfully. Please check your email to set a password.'
    });
});
