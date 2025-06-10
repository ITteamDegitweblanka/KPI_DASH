"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBranchStats = exports.deleteBranch = exports.updateBranch = exports.createBranch = exports.addBranch = exports.getBranch = exports.getBranches = exports.fetchBranches = exports.branchFilterableFields = void 0;
const http_status_codes_1 = require("http-status-codes");
const prisma_1 = require("../utils/prisma");
const api_error_1 = require("../utils/api-error");
const middleware_1 = require("../middleware");
const pick_1 = require("../utils/pick");
// Add branch filterable fields
exports.branchFilterableFields = ['search', 'name', 'location', 'isActive'];
/**
 * Get all branches with pagination and filtering
 */
/**
 * Get all branches (frontend-compatible version)
 * Matches frontend's fetchBranches()
 */
const fetchBranches = async (req, res) => {
    try {
        const branches = await prisma_1.prisma.branch.findMany({
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
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: branches
        });
    }
    catch (error) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch branches');
    }
};
exports.fetchBranches = fetchBranches;
const getBranches = async (req, res) => {
    const filter = (0, pick_1.pick)(req.query, exports.branchFilterableFields);
    const options = (0, pick_1.pick)(req.query, middleware_1.paginationFields);
    const { search, ...filterData } = filter;
    const { page = 1, limit = 10, sortBy, sortOrder } = options;
    const where = { isActive: true };
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
            prisma_1.prisma.branch.findMany({
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
            prisma_1.prisma.branch.count({ where })
        ]);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: branches,
            meta: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch branches');
    }
};
exports.getBranches = getBranches;
/**
 * Get branch by ID with details
 */
const getBranch = async (req, res) => {
    const { id } = req.params;
    try {
        const branch = await prisma_1.prisma.branch.findUnique({
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
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Branch not found');
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: branch
        });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            throw error;
        }
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch branch');
    }
};
exports.getBranch = getBranch;
/**
 * Create a new branch (Admin only)
 */
/**
 * Add a new branch (frontend-compatible version)
 * Matches frontend's addBranch(branchData)
 */
const addBranch = async (req, res) => {
    const { name, location, description } = req.body;
    try {
        // Case-insensitive search for existing branch
        const existingBranch = await prisma_1.prisma.branch.findFirst({
            where: {
                name: { equals: name, mode: 'insensitive' },
                isActive: true
            }
        });
        if (existingBranch) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.CONFLICT, 'A branch with this name already exists');
        }
        const branch = await prisma_1.prisma.branch.create({
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
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            data: branch
        });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError)
            throw error;
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create branch');
    }
};
exports.addBranch = addBranch;
const createBranch = async (req, res) => {
    const { name, location, description } = req.body;
    try {
        const existingBranch = await prisma_1.prisma.branch.findFirst({
            where: {
                name: { equals: name }
            }
        });
        if (existingBranch) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Branch with this name already exists');
        }
        const branch = await prisma_1.prisma.branch.create({
            data: {
                name,
                location,
                description
            }
        });
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            data: branch
        });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            throw error;
        }
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create branch');
    }
};
exports.createBranch = createBranch;
/**
 * Update a branch (Admin only)
 */
const updateBranch = async (req, res) => {
    const { id } = req.params;
    const { name, location, description } = req.body;
    try {
        const branch = await prisma_1.prisma.branch.findUnique({
            where: { id }
        });
        if (!branch) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Branch not found');
        }
        // Check if name is being updated and if it's already taken
        if (name && name !== branch.name) {
            const existingBranch = await prisma_1.prisma.branch.findFirst({
                where: {
                    name: { equals: name },
                    NOT: { id }
                }
            });
            if (existingBranch) {
                throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Branch with this name already exists');
            }
        }
        const updatedBranch = await prisma_1.prisma.branch.update({
            where: { id },
            data: {
                name,
                location,
                description
            }
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: updatedBranch
        });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            throw error;
        }
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update branch');
    }
};
exports.updateBranch = updateBranch;
/**
 * Delete a branch (Super Admin only)
 */
const deleteBranch = async (req, res) => {
    const { id } = req.params;
    try {
        const branch = await prisma_1.prisma.branch.findUnique({
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
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Branch not found');
        }
        if (branch._count.employees > 0 || branch._count.teams > 0) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Cannot delete branch with associated employees or teams');
        }
        await prisma_1.prisma.branch.delete({
            where: { id }
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: 'Branch deleted successfully'
        });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            throw error;
        }
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete branch');
    }
};
exports.deleteBranch = deleteBranch;
/**
 * Get branch statistics
 */
const getBranchStats = async (req, res) => {
    const { id } = req.params;
    try {
        const [userCount, teamCount, recentActivities] = await Promise.all([
            prisma_1.prisma.user.count({ where: { branchId: id } }),
            prisma_1.prisma.team.count({ where: { branchId: id } }),
            (async () => {
                const employees = await prisma_1.prisma.user.findMany({
                    where: { branchId: id },
                    select: { id: true }
                });
                const employeeIds = employees.map((user) => user.id);
                return prisma_1.prisma.goal.findMany({
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
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: {
                userCount,
                teamCount,
                recentActivities
            }
        });
    }
    catch (error) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch branch statistics');
    }
};
exports.getBranchStats = getBranchStats;
