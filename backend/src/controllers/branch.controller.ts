import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { ApiError } from '../utils/api-error';
import { paginationFields } from '../middleware';
import { pick } from '../utils/pick';

// Add branch filterable fields
export const branchFilterableFields = ['search', 'name', 'location', 'isActive'] as const;

// Define the branch where input type
type BranchWhereInput = {
  isActive?: boolean;
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    location?: { contains: string; mode: 'insensitive' };
  }>;
  AND?: Array<Record<string, { equals: unknown }>>;
};

/**
 * Get all branches with pagination and filtering
 */
/**
 * Get all branches (frontend-compatible version)
 * Matches frontend's fetchBranches()
 */
export const fetchBranches = async (req: Request, res: Response) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        location: true,
        description: true,
        isActive: true,
        _count: {
          select: { employees: true, teams: true }
        }
      }
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: branches
    });
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch branches');
  }
};

export const getBranches = async (req: Request, res: Response) => {
  const filter = pick(req.query, branchFilterableFields);
  const options = pick(req.query, paginationFields);
  const { search, ...filterData } = filter as { search?: string; [key: string]: unknown };
  const { page = 1, limit = 10, sortBy, sortOrder } = options as {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };

  const where: BranchWhereInput = { isActive: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (Object.keys(filterData).length > 0) {
    where.AND = Object.entries(filterData).map(([key, value]) => ({
      [key]: { equals: value }
    }));
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  try {
    const [branches, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        skip,
        take,
        orderBy: sortBy ? { [sortBy]: sortOrder || 'asc' } : { name: 'asc' },
        include: {
          _count: {
            select: { employees: true, teams: true }
          }
        }
      }),
      prisma.branch.count({ where })
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: branches,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch branches');
  }
};

/**
 * Get branch by ID with details
 */
export const getBranch = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        teams: {
          include: {
            _count: {
              select: { members: true }
            }
          }
        },
        _count: {
          select: {
            employees: true,
            teams: true
          }
        }
      }
    });

    if (!branch) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Branch not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: branch
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch branch');
  }
};

/**
 * Create a new branch (Admin only)
 */
/**
 * Add a new branch (frontend-compatible version)
 * Matches frontend's addBranch(branchData)
 */
export const addBranch = async (req: Request, res: Response) => {
  const { name, location, description } = req.body;

  try {
    // Case-insensitive search for existing branch
    const existingBranch = await prisma.branch.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' } as Prisma.StringFilter,
        isActive: true
      }
    });

    if (existingBranch) {
      throw new ApiError(StatusCodes.CONFLICT, 'A branch with this name already exists');
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        location,
        description: description || null,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        location: true,
        description: true,
        isActive: true
      }
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: branch
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create branch');
  }
};

export const createBranch = async (req: Request, res: Response) => {
  const { name, location, description } = req.body;

  try {
    const existingBranch = await prisma.branch.findFirst({
      where: {
        name: { equals: name }
      }
    });

    if (existingBranch) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Branch with this name already exists');
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        location,
        description
      }
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: branch
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create branch');
  }
};

/**
 * Update a branch (Admin only)
 */
export const updateBranch = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, location, description } = req.body;

  try {
    const branch = await prisma.branch.findUnique({
      where: { id }
    });

    if (!branch) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Branch not found');
    }

    // Check if name is being updated and if it's already taken
    if (name && name !== branch.name) {
      const existingBranch = await prisma.branch.findFirst({
        where: {
          name: { equals: name },
          NOT: { id }
        }
      });

      if (existingBranch) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Branch with this name already exists');
      }
    }

    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: {
        name,
        location,
        description
      }
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedBranch
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update branch');
  }
};

/**
 * Delete a branch (Super Admin only)
 */
export const deleteBranch = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
            teams: true
          }
        }
      }
    });

    if (!branch) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Branch not found');
    }

    if (branch._count.employees > 0 || branch._count.teams > 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Cannot delete branch with associated employees or teams'
      );
    }

    await prisma.branch.delete({
      where: { id }
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete branch');
  }
};

/**
 * Get branch statistics
 */
export const getBranchStats = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [userCount, teamCount, recentActivities] = await Promise.all([
      prisma.user.count({ where: { branchId: id } }),
      prisma.team.count({ where: { branchId: id } }),
      (async () => {
        const employees = await prisma.user.findMany({ 
          where: { branchId: id },
          select: { id: true }
        });
        const employeeIds = employees.map((user: { id: string }) => user.id);
        
        return prisma.goal.findMany({
          where: { employeeId: { in: employeeIds } },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });
      })()
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        userCount,
        teamCount,
        recentActivities
      }
    });
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch branch statistics');
  }
};
