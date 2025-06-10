import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { validationResult } from 'express-validator';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { ApiError } from '../utils/api-error';
import { asyncHandler } from '../middleware/error.middleware';
import { UserRole } from '../types';

/**
 * Test endpoint to verify the connection
 */
export const testConnection = asyncHandler(async (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Successfully connected to the backend API!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

/**
 * Register a new user
 */
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(ApiError.validationError('Validation error', errors.array()));
  }

  const { email, password, displayName, role = 'Staff' } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return next(new ApiError(StatusCodes.CONFLICT, 'Email already in use'));
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await prisma.user.create({
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
  const tokens = generateTokens(user.id, user.email, user.role as UserRole);

  res.status(StatusCodes.CREATED).json({
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
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(ApiError.validationError('Validation error', errors.array()));
  }

  const { email, password } = req.body;
  console.log('[LOGIN DEBUG] Attempting login for:', email);

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
  });
  console.log('[LOGIN DEBUG] User found:', !!user, user && { email: user.email, role: user.role, isActive: user.isActive });

  if (!user) {
    console.log('[LOGIN DEBUG] User not found:', email);
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password'));
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  console.log('[LOGIN DEBUG] Password match:', passwordMatch);

  if (!passwordMatch) {
    console.log('[LOGIN DEBUG] Password mismatch for:', email);
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password'));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new ApiError(StatusCodes.FORBIDDEN, 'Account is deactivated'));
  }

  // Generate tokens
  const tokens = generateTokens(user.id, user.email, user.role as UserRole);

  // Update last login
  await prisma.user.update({
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
  res.status(StatusCodes.OK).json(response);
});

/**
 * Get current user profile
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
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
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  res.status(StatusCodes.OK).json({
    success: true,
    data: user,
  });
});

/**
 * Refresh access token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new ApiError(StatusCodes.BAD_REQUEST, 'Refresh token is required'));
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.secret) as {
      id: string;
      email: string;
      role: UserRole;
    };

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'User not found or inactive'));
    }

    // Generate new tokens
    const tokens = generateTokens(user.id, user.email, user.role as UserRole);

    res.status(StatusCodes.OK).json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token expired'));
    }
    next(error);
  }
});

/**
 * Logout user (client should delete the token)
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // In a real application, you might want to implement token blacklisting here
  // For JWT, since they are stateless, we just inform the client to delete the token
  
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Successfully logged out',
  });
});

/**
 * Generate JWT tokens
 */
const generateTokens = (userId: string, email: string, role: UserRole) => {
  const accessToken = jwt.sign(
    { id: userId, email, role },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpirationMinutes * 60 } // in seconds
  );

  const refreshToken = jwt.sign(
    { id: userId, email, role },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpirationDays * 24 * 60 * 60 } // in seconds
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.accessExpirationMinutes * 60, // in seconds
  };
};