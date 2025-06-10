"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addEmployeeToTeam = exports.getAllTeams = exports.addAdminTeam = exports.fetchAdminTeams = exports.removeTeamEmployee = exports.addTeamEmployee = exports.getTeamEmployees = exports.deleteTeam = exports.updateTeam = exports.createTeam = exports.getTeamById = exports.getTeams = void 0;
const http_status_codes_1 = require("http-status-codes");
const client_1 = require("@prisma/client");
const prisma_1 = require("../utils/prisma");
const api_error_1 = require("../utils/api-error");
const prismaClient = new client_1.PrismaClient();
/**
 * Get all teams with pagination and filtering
 */
const getTeams = async (req, res) => {
    const { page = 1, limit = 10, branchId, search } = req.query;
    const skip = (page - 1) * limit;
    const where = {};
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
    const total = await prisma_1.prisma.team.count({ where });
    // Get paginated teams
    const teams = await prisma_1.prisma.team.findMany({
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
    res.status(http_status_codes_1.StatusCodes.OK).json({
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
exports.getTeams = getTeams;
/**
 * Get team by ID with members and details
 */
const getTeamById = async (req, res) => {
    const { teamId } = req.params;
    const team = await prisma_1.prisma.team.findUnique({
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
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Team not found');
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        data: team,
    });
};
exports.getTeamById = getTeamById;
/**
 * Create a new team (Admin only)
 */
const createTeam = async (req, res) => {
    const { name, description, branchId, leaderId } = req.body;
    // Check if branch exists
    const branch = await prisma_1.prisma.branch.findUnique({
        where: { id: branchId },
    });
    if (!branch) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Branch not found');
    }
    // Check if leader exists if provided
    if (leaderId) {
        const leader = await prisma_1.prisma.user.findUnique({
            where: { id: leaderId },
        });
        if (!leader) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Team leader not found');
        }
    }
    // Create team
    const team = await prisma_1.prisma.team.create({
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
        await prisma_1.prisma.user.update({
            where: { id: leaderId },
            data: {
                teamId: team.id,
                role: 'LEADER',
            },
        });
    }
    res.status(http_status_codes_1.StatusCodes.CREATED).json({
        success: true,
        data: team,
    });
};
exports.createTeam = createTeam;
/**
 * Update a team (Admin only)
 */
const updateTeam = async (req, res) => {
    const { teamId } = req.params;
    const { name, description, branchId, leaderId } = req.body;
    const isActive = typeof req.body.isActive === 'boolean' ? req.body.isActive : true;
    // Check if team exists
    const team = await prisma_1.prisma.team.findUnique({
        where: { id: teamId },
        include: { leader: true },
    });
    if (!team) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Team not found');
    }
    // Check if branch exists if provided
    if (branchId) {
        const branch = await prisma_1.prisma.branch.findUnique({
            where: { id: branchId },
        });
        if (!branch) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Branch not found');
        }
    }
    // Check if new leader exists if provided
    let newLeader = null;
    if (leaderId && leaderId !== team.leaderId) {
        newLeader = await prisma_1.prisma.user.findUnique({
            where: { id: leaderId },
        });
        if (!newLeader) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'New team leader not found');
        }
    }
    // Start a transaction to update team and user roles
    const [updatedTeam] = await prisma_1.prisma.$transaction([
        // Update the team
        prisma_1.prisma.team.update({
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
                prisma_1.prisma.user.update({
                    where: { id: leaderId },
                    data: {
                        role: 'LEADER',
                        teamId: teamId,
                    },
                }),
            ]
            : []),
    ]);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        data: updatedTeam,
    });
};
exports.updateTeam = updateTeam;
/**
 * Delete a team (Admin only)
 */
const deleteTeam = async (req, res) => {
    const { teamId } = req.params;
    // Check if team exists
    const team = await prisma_1.prisma.team.findUnique({
        where: { id: teamId },
        include: { members: true },
    });
    if (!team) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Team not found');
    }
    // Start a transaction to handle team deletion and user updates
    await prisma_1.prisma.$transaction([
        // Remove all members from the team
        prisma_1.prisma.user.updateMany({
            where: { teamId },
            data: { teamId: null },
        }),
        // Delete the team
        prisma_1.prisma.team.delete({
            where: { id: teamId },
        }),
    ]);
    res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
};
exports.deleteTeam = deleteTeam;
/**
 * Get team employees
 */
const getTeamEmployees = async (req, res) => {
    const { teamId } = req.params;
    // Check if team exists
    const team = await prisma_1.prisma.team.findUnique({
        where: { id: teamId },
    });
    if (!team) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Team not found');
    }
    const employees = await prisma_1.prisma.user.findMany({
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
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        data: employees,
    });
};
exports.getTeamEmployees = getTeamEmployees;
/**
 * Add employee to team (Admin/Team Leader only)
 */
const addTeamEmployee = async (req, res) => {
    const { teamId, userId } = req.params;
    // Check if team exists
    const team = await prisma_1.prisma.team.findUnique({
        where: { id: teamId },
    });
    if (!team) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Team not found');
    }
    // Check if user exists
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    // Check if user is already in a team
    if (user.teamId && user.teamId !== teamId) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User is already an employee of another team');
    }
    // Check if user is already in this team
    if (user.teamId === teamId) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User is already an employee of this team');
    }
    // Update user's team
    const updatedUser = await prisma_1.prisma.user.update({
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
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        data: updatedUser,
    });
};
exports.addTeamEmployee = addTeamEmployee;
/**
 * Remove employee from team (Admin/Team Leader only)
 */
const removeTeamEmployee = async (req, res) => {
    const { teamId, userId } = req.params;
    // Check if team exists
    const team = await prisma_1.prisma.team.findUnique({
        where: { id: teamId },
    });
    if (!team) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Team not found');
    }
    // Check if user exists and is an employee of the team
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId, teamId },
    });
    if (!user) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found in this team');
    }
    // If the user is the team leader, remove them as leader first
    if (team.leaderId === userId) {
        await prisma_1.prisma.team.update({
            where: { id: teamId },
            data: { leaderId: null },
        });
    }
    // Remove user from team
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            teamId: null,
            // If the user was a leader, demote to staff
            ...(user.role === 'LEADER' ? { role: 'STAFF' } : {})
        },
    });
    res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
};
exports.removeTeamEmployee = removeTeamEmployee;
// Get all teams
/**
 * Get all teams with admin privileges (includes additional details)
 */
const fetchAdminTeams = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const searchTerm = search;
        const where = {};
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
            prisma_1.prisma.team.findMany({
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
            prisma_1.prisma.team.count({ where }),
        ]);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: teams,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch admin teams');
    }
};
exports.fetchAdminTeams = fetchAdminTeams;
const addAdminTeam = async (req, res) => {
    try {
        const { name, description, branchId, leaderId } = req.body;
        // Parse isActive from request body with proper type safety
        const isActive = (() => {
            const { isActive: isActiveValue } = req.body;
            if (isActiveValue === undefined)
                return true;
            if (typeof isActiveValue === 'boolean')
                return isActiveValue;
            if (typeof isActiveValue === 'string') {
                if (isActiveValue === 'true')
                    return true;
                if (isActiveValue === 'false')
                    return false;
                return Boolean(isActiveValue);
            }
            return Boolean(isActiveValue);
        })();
        // Check if team with same name already exists
        const existingTeam = await prisma_1.prisma.team.findFirst({
            where: { name },
        });
        if (existingTeam) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Team with this name already exists');
        }
        // Convert empty strings to null for optional fields
        const teamName = name.trim();
        const teamDescription = typeof description === 'string' ? description.trim() : null;
        // Validate branch exists
        if (branchId) {
            const branch = await prisma_1.prisma.branch.findUnique({
                where: { id: branchId },
            });
            if (!branch) {
                throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Branch not found');
            }
        }
        // Validate leader exists and is a valid team leader
        if (leaderId) {
            const leader = await prisma_1.prisma.user.findUnique({
                where: { id: leaderId },
            });
            if (!leader) {
                throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Team leader not found');
            }
            if (!["LEADER", "ADMIN", "SUPER_ADMIN"].includes(leader.role)) {
                throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Team leader must have a leadership role (LEADER, ADMIN, or SUPER_ADMIN)');
            }
        }
        // Create the team with proper relationship handling
        const teamData = {
            name: teamName,
            description: teamDescription,
            isActive,
            // Branch is required in the schema
            branch: {
                connect: { id: branchId },
            },
            // Leader is optional
            ...(leaderId && {
                leader: {
                    connect: { id: leaderId },
                },
            }),
        };
        const team = await prisma_1.prisma.team.create({
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
                const userUpdate = {
                    team: {
                        connect: { id: team.id }
                    }
                };
                await prisma_1.prisma.user.update({
                    where: { id: leaderIdString },
                    data: userUpdate
                });
            }
            catch (error) {
                console.error('Error updating team leader:', error);
                // Continue even if updating leader fails, as the team was created successfully
            }
        }
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            data: team,
        });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError)
            throw error;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create team', true, [errorMessage]);
    }
};
exports.addAdminTeam = addAdminTeam;
/**
 * @deprecated Use fetchAdminTeams instead
 */
const getAllTeams = async (req, res) => {
    try {
        const teams = await prisma_1.prisma.team.findMany({
            include: {
                branch: true,
                leader: true,
                members: true,
            },
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: teams,
        });
    }
    catch (error) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch teams');
    }
};
exports.getAllTeams = getAllTeams;
// Add employee to team
const addEmployeeToTeam = async (req, res) => {
    const { employeeId, teamId } = req.body;
    try {
        // Check if employee exists
        const employee = await prisma_1.prisma.user.findUnique({
            where: { id: employeeId },
        });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        // Check if team exists
        const team = await prisma_1.prisma.team.findUnique({
            where: { id: teamId },
        });
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        // Update employee's team
        const updatedEmployee = await prisma_1.prisma.user.update({
            where: { id: employeeId },
            data: { teamId },
            include: {
                team: true,
            },
        });
        res.json(updatedEmployee);
    }
    catch (error) {
        console.error('Error adding employee to team:', error);
        res.status(500).json({ message: 'Error adding employee to team' });
    }
};
exports.addEmployeeToTeam = addEmployeeToTeam;
