import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { ApiError } from '../utils/api-error';
import { asyncHandler } from '../middleware/error.middleware';
import { UserRole } from '../types';

// Extend the Express Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        teamId?: string | null;
      };
    }
  }
}

/**
 * Get all users with pagination and filtering
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = { isActive: true };

  if (search) {
    const searchTerm = typeof search === 'string' ? search.toLowerCase() : String(search);
    where.OR = [
      { displayName: { contains: searchTerm } },
      { email: { contains: searchTerm } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
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
    prisma.user.count({ where }),
  ]);

  res.status(StatusCodes.OK).json({
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
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  const user = await prisma.user.findUnique({
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
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  res.status(StatusCodes.OK).json({ success: true, data: user });
});

/**
 * Get user by ID
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const user = await prisma.user.findUnique({
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
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  res.status(StatusCodes.OK).json({ success: true, data: user });
});

/**
 * Update user profile
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { displayName, title, phoneNumber, avatarUrl } = req.body;

  const user = await prisma.user.update({
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

  res.status(StatusCodes.OK).json({ success: true, data: user });
});

/**
 * Update user role (Super Admin only)
 */
export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body as { role: any };

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // Prevent changing role of the last Super Admin
  if (user.role === 'SUPER_ADMIN') {
    const superAdminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN' },
    });

    if (superAdminCount <= 1) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Cannot change role of the last Super Admin'
      );
    }
  }

  // Update user role
  const updatedUser = await prisma.user.update({
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

  res.status(StatusCodes.OK).json({ success: true, data: updatedUser });
});

/**
 * Delete user (Soft delete)
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // Prevent deleting the last Super Admin
  if (user.role === 'SUPER_ADMIN') {
    const superAdminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN' },
    });

    if (superAdminCount <= 1) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Cannot delete the last Super Admin'
      );
    }
  }

  // Soft delete user
  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
      email: `deleted-${Date.now()}-${user.email}`, // De-anonymize email
    },
  });

  res.status(StatusCodes.NO_CONTENT).send();
});

/**
 * Get all team members for the current user's team
 */
export const getTeamMembers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  const { id: userId, role, teamId } = req.user;

  if (!['LEADER', 'SUB_LEADER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Only team leaders, sub-leaders, and admins can view team members'
    );
  }

  const where: any = {
    isActive: true,
  };

  if (!['ADMIN', 'SUPER_ADMIN'].includes(role) && teamId) {
    where.teamId = teamId;
    where.role = {
      in: ['MEMBER', 'LEADER', 'SUB_LEADER'],
    };
  }

  const teamMembers = await prisma.user.findMany({
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

  res.status(StatusCodes.OK).json({ success: true, data: teamMembers });
});

/**
 * Get all admin users (Admin and Super Admin)
 */
export const getAdminUsers = asyncHandler(async (req: Request, res: Response) => {
  const admins = await prisma.user.findMany({
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

  res.status(StatusCodes.OK).json({ success: true, data: admins });
});

/**
 * Add a new admin user
 */
export const addAdminUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, role = 'ADMIN' } = req.body;

  // Validate role
  if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid admin role');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, 'User already exists');
  }

  // Create new admin user
  const adminUser = await prisma.user.create({
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

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: adminUser,
    message: 'Admin user created successfully. Please check your email to set a password.'
  });
});


