import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { config } from '../config';
import { ApiError } from '../utils/api-error';
import { UserRole } from '../types';
import { prisma } from '../utils/prisma';

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
 * Middleware to authenticate user using JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'No token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      email: string;
      role: UserRole;
      iat: number;
      exp: number;
    };

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'User no longer exists or is inactive'));
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Token expired'));
    }
    next(error);
  }
};

/**
 * Middleware to check if user has required roles
 */
export const authorize = (roles: UserRole[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required'));
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return next(
        new ApiError(
          StatusCodes.FORBIDDEN,
          `User role ${req.user.role} is not authorized to access this route`
        )
      );
    }

    next();
  };
};

/**
 * Middleware to check if user is the owner of the resource or has admin role
 */
export const isOwnerOrAdmin = (paramName = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required'));
    }

    // Allow admins to access any resource
    if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    // Check if the requested resource ID matches the user's ID
    const resourceId = req.params[paramName];
    if (resourceId !== req.user.id) {
      return next(
        new ApiError(
          StatusCodes.FORBIDDEN,
          'You do not have permission to access this resource'
        )
      );
    }

    next();
  };
};

/**
 * Middleware to check if user is a team leader or admin
 */
export const isTeamLeaderOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required'));
  }

  // Allow admins to access any resource
  if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN) {
    return next();
  }

  // Check if user is a team leader or sub-leader
  if (req.user.role !== UserRole.LEADER && req.user.role !== UserRole.SUB_LEADER) {
    return next(
      new ApiError(
        StatusCodes.FORBIDDEN,
        'You must be a team leader or admin to access this resource'
      )
    );
  }

  next();
};

/**
 * Middleware to check if user is an admin or super admin
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required'));
  }

  if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
    return next(
      new ApiError(
        StatusCodes.FORBIDDEN,
        'You must be an admin to access this resource'
      )
    );
  }

  next();
};

/**
 * Middleware to check if user is a super admin
 */
export const isSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required'));
  }

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return next(
      new ApiError(
        StatusCodes.FORBIDDEN,
        'You must be a super admin to access this resource'
      )
    );
  }

  next();
};