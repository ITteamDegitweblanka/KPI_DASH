import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Prisma, PrismaClient, Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { ApiError } from '../utils/api-error';

const prismaClient = new PrismaClient();

/**
 * Get all teams with pagination and filtering
 */
export const getTeams = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, branchId, search } = req.query as {
    page?: number;
    limit?: number;
    branchId?: string;
    search?: string;
  };

  const skip = (page - 1) * limit;
  const where: any = {};

  // Apply filters
  if (branchId) {
    where.branchId = branchId;
  }

  if (search) {
    where.OR = [
      { 
        name: {
          contains: search,
          mode: 'insensitive'
        }
      },
      { 
        description: {
          contains: search,
          mode: 'insensitive'
        }
      }
    ];
  }

  // Get total count for pagination
  const total = await prisma.team.count({ where });

  // Get paginated teams
  const teams = await prisma.team.findMany({
    where,
    include: {
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
      leader: {
        select: {
          id: true,
          displayName: true,
          email: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: { name: 'asc' },
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: teams,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
};

/**
 * Get team by ID with members and details
 */
export const getTeamById = async (req: Request, res: Response) => {
  const { teamId } = req.params;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
      leader: {
        select: {
          id: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          role: true,
        },
      },
      members: {
        select: {
          id: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          role: true,
          title: true,
          phoneNumber: true,
          isActive: true,
          lastLogin: true,
        },
        orderBy: { displayName: 'asc' },
      },
    },
  });

  if (!team) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Team not found');
  }

  res.status(StatusCodes.OK).json({
    success: true,
    data: team,
  });
};

/**
 * Create a new team (Admin only)
 */
export const createTeam = async (req: Request, res: Response) => {
  const { name, description, branchId, leaderId } = req.body;

  // Check if branch exists
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
  });

  if (!branch) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Branch not found');
  }

  // Check if leader exists if provided
  if (leaderId) {
    const leader = await prisma.user.findUnique({
      where: { id: leaderId },
    });

    if (!leader) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Team leader not found');
    }
  }

  // Create team
  const team = await prisma.team.create({
    data: {
      name,
      description,
      branchId,
      leaderId: leaderId || null,
    },
    include: {
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
      leader: {
        select: {
          id: true,
          displayName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  // If a leader was specified, update their team and role
  if (leaderId) {
    await prisma.user.update({
      where: { id: leaderId },
      data: {
        teamId: team.id,
        role: 'LEADER' as const,
      },
    });
  }

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: team,
  });
};

/**
 * Update a team (Admin only)
 */
export const updateTeam = async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const { name, description, branchId, leaderId } = req.body;
  const isActive: boolean = typeof req.body.isActive === 'boolean' ? req.body.isActive : true;

  // Check if team exists
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { leader: true },
  });

  if (!team) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Team not found');
  }

  // Check if branch exists if provided
  if (branchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Branch not found');
    }
  }

  // Check if new leader exists if provided
  let newLeader = null;
  if (leaderId && leaderId !== team.leaderId) {
    newLeader = await prisma.user.findUnique({
      where: { id: leaderId },
    });

    if (!newLeader) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'New team leader not found');
    }
  }

  // Start a transaction to update team and user roles
  const [updatedTeam] = await prisma.$transaction([
    // Update the team
    prisma.team.update({
      where: { id: teamId },
      data: {
        name,
        description,
        branchId,
        leaderId: leaderId || team.leaderId,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        leader: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    }),
    // Update the new leader's role and team if leader changed
    ...(leaderId && leaderId !== team.leaderId && newLeader
      ? [
          prisma.user.update({
            where: { id: leaderId },
            data: {
              role: 'LEADER' as const,
              teamId: teamId,
            },
          }),
        ]
      : []),
  ]);

  res.status(StatusCodes.OK).json({
    success: true,
    data: updatedTeam,
  });
};

/**
 * Delete a team (Admin only)
 */
export const deleteTeam = async (req: Request, res: Response) => {
  const { teamId } = req.params;

  // Check if team exists
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Team not found');
  }

  // Start a transaction to handle team deletion and user updates
  await prisma.$transaction([
    // Remove all members from the team
    prisma.user.updateMany({
      where: { teamId },
      data: { teamId: null },
    }),
    // Delete the team
    prisma.team.delete({
      where: { id: teamId },
    }),
  ]);

  res.status(StatusCodes.NO_CONTENT).send();
};

/**
 * Get team employees
 */
export const getTeamEmployees = async (req: Request, res: Response) => {
  const { teamId } = req.params;

  // Check if team exists
  const team = await prisma.team.findUnique({
    where: { id: teamId },
  });

  if (!team) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Team not found');
  }

  const employees = await prisma.user.findMany({
    where: { teamId },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      title: true,
      phoneNumber: true,
      avatarUrl: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
    },
    orderBy: { displayName: 'asc' },
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: employees,
  });
};

/**
 * Add employee to team (Admin/Team Leader only)
 */
export const addTeamEmployee = async (req: Request, res: Response) => {
  const { teamId, userId } = req.params;

  // Check if team exists
  const team = await prisma.team.findUnique({
    where: { id: teamId },
  });

  if (!team) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Team not found');
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // Check if user is already in a team
  if (user.teamId && user.teamId !== teamId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'User is already an employee of another team'
    );
  }

  // Check if user is already in this team
  if (user.teamId === teamId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'User is already an employee of this team'
    );
  }

  // Update user's team
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { teamId },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      title: true,
      phoneNumber: true,
      avatarUrl: true,
      isActive: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: updatedUser,
  });
};

/**
 * Remove employee from team (Admin/Team Leader only)
 */
export const removeTeamEmployee = async (req: Request, res: Response) => {
  const { teamId, userId } = req.params;

  // Check if team exists
  const team = await prisma.team.findUnique({
    where: { id: teamId },
  });

  if (!team) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Team not found');
  }

  // Check if user exists and is an employee of the team
  const user = await prisma.user.findUnique({
    where: { id: userId, teamId },
  });

  if (!user) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'User not found in this team'
    );
  }

  // If the user is the team leader, remove them as leader first
  if (team.leaderId === userId) {
    await prisma.team.update({
      where: { id: teamId },
      data: { leaderId: null },
    });
  }

  // Remove user from team
  await prisma.user.update({
    where: { id: userId },
    data: {
      teamId: null,
      // If the user was a leader, demote to staff
      ...(user.role === 'LEADER' ? { role: 'STAFF' as Role } : {})
    },
  });

  res.status(StatusCodes.NO_CONTENT).send();
};

// Get all teams
/**
 * Get all teams with admin privileges (includes additional details)
 */
export const fetchAdminTeams = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query as {
      page?: number;
      limit?: number;
      search?: string;
    };

    const skip = (Number(page) - 1) * Number(limit);
    
    const searchTerm = search as string;
    const where: Prisma.TeamWhereInput = {};
    
    if (searchTerm) {
      // For case-insensitive search, we'll use the contains operator
      // and handle case insensitivity at the database level if needed
      where.OR = [
        { 
          name: { 
            contains: searchTerm
          } 
        },
        { 
          description: { 
            contains: searchTerm
          } 
        },
      ];
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        include: {
          branch: true,
          leader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          members: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
            take: 5, // Limit number of members included in the list
          },
          _count: {
            select: { members: true },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: Number(limit),
      }),
      prisma.team.count({ where }),
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: teams,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to fetch admin teams'
    );
  }
};

/**
 * Create a new team with admin privileges
 */
interface CreateTeamRequest {
  name: string;
  description?: string | null;
  branchId?: string | null;
  leaderId?: string | null;
  isActive?: boolean | string; // Allow string for form data parsing
}

export const addAdminTeam = async (req: Request<{}, {}, CreateTeamRequest>, res: Response) => {
  try {
    const { name, description, branchId, leaderId } = req.body;
    // Parse isActive from request body with proper type safety
    const isActive: boolean = (() => {
      const { isActive: isActiveValue } = req.body;
      if (isActiveValue === undefined) return true;
      if (typeof isActiveValue === 'boolean') return isActiveValue;
      if (typeof isActiveValue === 'string') {
        if (isActiveValue === 'true') return true;
        if (isActiveValue === 'false') return false;
        return Boolean(isActiveValue);
      }
      return Boolean(isActiveValue);
    })();

    // Check if team with same name already exists
    const existingTeam = await prisma.team.findFirst({
      where: { name },
    });

    if (existingTeam) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Team with this name already exists');
    }
    
    // Convert empty strings to null for optional fields
    const teamName = name.trim();
    const teamDescription = typeof description === 'string' ? description.trim() : null;

    // Validate branch exists
    if (branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
      });

      if (!branch) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Branch not found');
      }
    }

    // Validate leader exists and is a valid team leader
    if (leaderId) {
      const leader = await prisma.user.findUnique({
        where: { id: leaderId },
      });

      if (!leader) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Team leader not found');
      }

      if (!["LEADER", "ADMIN", "SUPER_ADMIN"].includes(leader.role)) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Team leader must have a leadership role (LEADER, ADMIN, or SUPER_ADMIN)'
        );
      }
    }

    // Create the team with proper relationship handling
    const teamData: Prisma.TeamCreateInput = {
      name: teamName,
      description: teamDescription,
      isActive,
      // Branch is required in the schema
      branch: {
        connect: { id: branchId! },
      },
      // Leader is optional
      ...(leaderId && {
        leader: {
          connect: { id: leaderId },
        },
      }),
    };

    const team = await prisma.team.create({
      data: teamData,
      include: {
        branch: true,
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // If leader was specified, add them to the team
    if (leaderId) {
      try {
        // Create a type-safe update operation with proper type assertions
        const leaderIdString = String(leaderId);
        const userUpdate: Prisma.UserUpdateInput = {
          team: {
            connect: { id: team.id }
          }
        };
        await prisma.user.update({
          where: { id: leaderIdString },
          data: userUpdate
        });
      } catch (error) {
        console.error('Error updating team leader:', error);
        // Continue even if updating leader fails, as the team was created successfully
      }
    }

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: team,
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create team',
      true,
      [errorMessage]
    );
  }
};

/**
 * @deprecated Use fetchAdminTeams instead
 */
export const getAllTeams = async (req: Request, res: Response) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        branch: true,
        leader: true,
        members: true,
      },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: teams,
    });
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to fetch teams'
    );
  }
};

// Add employee to team
export const addEmployeeToTeam = async (req: Request, res: Response) => {
  const { employeeId, teamId } = req.body;

  try {
    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Update employee's team
    const updatedEmployee = await prisma.user.update({
      where: { id: employeeId },
      data: { teamId },
      include: {
        team: true,
      },
    });

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Error adding employee to team:', error);
    res.status(500).json({ message: 'Error adding employee to team' });
  }
};