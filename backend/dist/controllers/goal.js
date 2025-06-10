"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGoal = exports.getGoalById = exports.getTeamGoals = exports.updateGoal = exports.createGoal = exports.getEmployeeGoals = void 0;
const http_status_codes_1 = require("http-status-codes");
const api_error_1 = require("../utils/api-error");
const prisma_1 = require("../utils/prisma");
const client_1 = require("@prisma/client");
const types_1 = require("../types");
/**
 * Get all goals for an employee
 */
const getEmployeeGoals = async (req, res) => {
    const { employeeId } = req.params;
    const goals = await prisma_1.prisma.goal.findMany({
        where: { employeeId },
        select: {
            id: true,
            title: true,
            description: true,
            type: true,
            status: true,
            targetValue: true,
            currentValue: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
            employee: {
                select: {
                    id: true,
                    displayName: true,
                },
            },
            team: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        data: goals,
    });
};
exports.getEmployeeGoals = getEmployeeGoals;
/**
 * Create a new goal
 */
const createGoal = async (req, res) => {
    const { title, description, type = client_1.GoalType.PERFORMANCE, status = client_1.GoalStatus.NOT_STARTED, targetValue = 0, employeeId, teamId } = req.body;
    // Check if employee exists
    const employee = await prisma_1.prisma.user.findUnique({
        where: { id: employeeId },
        select: { id: true },
    });
    if (!employee) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Employee not found');
    }
    // Check if team exists if provided
    if (teamId) {
        const team = await prisma_1.prisma.team.findUnique({
            where: { id: teamId },
            select: { id: true },
        });
        if (!team) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Team not found');
        }
    }
    const goal = await prisma_1.prisma.goal.create({
        data: {
            title,
            description,
            type,
            status,
            targetValue,
            employee: {
                connect: { id: employeeId },
            },
            ...(teamId && {
                team: {
                    connect: { id: teamId },
                },
            }),
        },
    });
    res.status(http_status_codes_1.StatusCodes.CREATED).json({
        success: true,
        data: goal,
    });
};
exports.createGoal = createGoal;
/**
 * Update a goal
 */
const updateGoal = async (req, res) => {
    const { id } = req.params;
    const { title, description, type, status, targetValue, employeeId, teamId } = req.body;
    // Check if goal exists
    const existingGoal = await prisma_1.prisma.goal.findUnique({
        where: { id },
        select: {
            id: true,
            status: true,
            targetValue: true
        },
    });
    if (!existingGoal) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Goal not found');
    }
    // Check if employee exists if provided
    if (employeeId) {
        const employee = await prisma_1.prisma.user.findUnique({
            where: { id: employeeId },
            select: { id: true },
        });
        if (!employee) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Employee not found');
        }
    }
    // Check if team exists if provided
    if (teamId) {
        const team = await prisma_1.prisma.team.findUnique({
            where: { id: teamId },
            select: { id: true },
        });
        if (!team) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Team not found');
        }
    }
    const updateData = {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(status && { status }),
        ...(targetValue !== undefined && { targetValue }),
        ...(employeeId && {
            employee: {
                connect: { id: employeeId },
            },
        }),
        ...(teamId && {
            team: {
                connect: { id: teamId },
            },
        }),
    };
    // Update completedAt if status is COMPLETED
    if (status === client_1.GoalStatus.COMPLETED && existingGoal.status !== client_1.GoalStatus.COMPLETED) {
        updateData.completedAt = new Date();
    }
    const updatedGoal = await prisma_1.prisma.goal.update({
        where: { id },
        data: updateData,
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        data: updatedGoal,
    });
};
exports.updateGoal = updateGoal;
/**
 * Delete a goal
 */
const getTeamGoals = async (req, res) => {
    const { teamId } = req.params;
    const { status } = req.query;
    const where = {
        teamId,
    };
    if (status) {
        where.status = status;
    }
    const goals = await prisma_1.prisma.goal.findMany({
        where,
        select: {
            id: true,
            title: true,
            description: true,
            type: true,
            status: true,
            targetValue: true,
            currentValue: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
            employee: {
                select: {
                    id: true,
                    displayName: true,
                },
            },
            team: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        data: goals,
    });
};
exports.getTeamGoals = getTeamGoals;
const getGoalById = async (req, res) => {
    const { id } = req.params;
    const goal = await prisma_1.prisma.goal.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            description: true,
            type: true,
            status: true,
            targetValue: true,
            currentValue: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
            employee: {
                select: {
                    id: true,
                    displayName: true,
                    email: true,
                },
            },
            team: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    if (!goal) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Goal not found');
    }
    // Check if user has permission to view this goal
    const canView = !req.user ? false :
        req.user.role === types_1.UserRole.ADMIN ||
            req.user.role === types_1.UserRole.SUPER_ADMIN ||
            (goal.employee && goal.employee.id === req.user.id) ||
            (req.user.teamId && goal.team && goal.team.id === req.user.teamId);
    if (!canView) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to view this goal');
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        data: goal,
    });
};
exports.getGoalById = getGoalById;
const deleteGoal = async (req, res) => {
    const { id } = req.params;
    // Check if goal exists
    const goal = await prisma_1.prisma.goal.findUnique({
        where: { id },
        select: {
            id: true,
            employeeId: true,
            teamId: true,
        },
    });
    if (!goal) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Goal not found');
    }
    // Check permissions
    const isAdmin = [types_1.UserRole.ADMIN, types_1.UserRole.SUPER_ADMIN].includes(req.user?.role);
    const isOwner = goal.employeeId === req.user?.id;
    const isTeamLead = req.user?.teamId === goal.teamId &&
        [types_1.UserRole.LEADER].includes(req.user?.role);
    if (!isAdmin && !isOwner && !isTeamLead) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to delete this goal');
    }
    await prisma_1.prisma.goal.delete({
        where: { id },
    });
    res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
};
exports.deleteGoal = deleteGoal;
