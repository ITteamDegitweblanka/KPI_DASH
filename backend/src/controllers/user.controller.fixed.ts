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

  // Check if the current user is a super admin
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to update user role');
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

  // Soft delete the user
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'User deleted successfully',
  });
});

/**
 * Get user's team members
 */
export const getTeamMembers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.teamId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User is not part of a team');
  }

  const teamMembers = await prisma.user.findMany({
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

  res.status(StatusCodes.OK).json({ success: true, data: teamMembers });
});
