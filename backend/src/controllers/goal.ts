import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/api-error';
import { prisma } from '../utils/prisma';
import { GoalStatus, GoalType, Prisma } from '@prisma/client';
import { UserRole } from '../types';

/**
 * Get all goals for an employee
 */
export const getEmployeeGoals = async (req: Request, res: Response) => {
  const { employeeId } = req.params;

  const goals = await prisma.goal.findMany({
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

  res.status(StatusCodes.OK).json({
    success: true,
    data: goals,
  });
};

/**
 * Create a new goal
 */
export const createGoal = async (req: Request, res: Response) => {
  const { 
    title, 
    description, 
    type = GoalType.PERFORMANCE, 
    status = GoalStatus.NOT_STARTED,
    targetValue = 0,
    employeeId,
    teamId
  } = req.body;

  // Check if employee exists
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { id: true },
  });

  if (!employee) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Employee not found');
  }

  // Check if team exists if provided
  if (teamId) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true },
    });

    if (!team) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Team not found');
    }
  }

  const goal = await prisma.goal.create({
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

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: goal,
  });
};

/**
 * Update a goal
 */
export const updateGoal = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    title, 
    description, 
    type, 
    status, 
    targetValue,
    employeeId,
    teamId
  } = req.body;

  // Check if goal exists
  const existingGoal = await prisma.goal.findUnique({
    where: { id },
    select: { 
      id: true,
      status: true,
      targetValue: true
    },
  });

  if (!existingGoal) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Goal not found');
  }

  // Check if employee exists if provided
  if (employeeId) {
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });

    if (!employee) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Employee not found');
    }
  }

  // Check if team exists if provided
  if (teamId) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true },
    });

    if (!team) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Team not found');
    }
  }

  const updateData: any = {
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
  if (status === GoalStatus.COMPLETED && existingGoal.status !== GoalStatus.COMPLETED) {
    updateData.completedAt = new Date();
  }

  const updatedGoal = await prisma.goal.update({
    where: { id },
    data: updateData,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: updatedGoal,
  });
};

/**
 * Delete a goal
 */
export const getTeamGoals = async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const { status } = req.query;

  const where: Prisma.GoalWhereInput = {
    teamId,
  };

  if (status) {
    where.status = status as GoalStatus;
  }

  const goals = await prisma.goal.findMany({
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

  res.status(StatusCodes.OK).json({
    success: true,
    data: goals,
  });
};

export const getGoalById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const goal = await prisma.goal.findUnique({
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
    throw new ApiError(StatusCodes.NOT_FOUND, 'Goal not found');
  }

  // Check if user has permission to view this goal
  const canView = 
    !req.user ? false :
    req.user.role === UserRole.ADMIN || 
    req.user.role === UserRole.SUPER_ADMIN ||
    (goal.employee && goal.employee.id === req.user.id) ||
    (req.user.teamId && goal.team && goal.team.id === req.user.teamId);

  if (!canView) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to view this goal');
  }

  res.status(StatusCodes.OK).json({
    success: true,
    data: goal,
  });
};

export const deleteGoal = async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if goal exists
  const goal = await prisma.goal.findUnique({
    where: { id },
    select: { 
      id: true,
      employeeId: true,
      teamId: true,
    },
  });

  if (!goal) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Goal not found');
  }

  // Check permissions
  const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(req.user?.role as UserRole);
  const isOwner = goal.employeeId === req.user?.id;
  const isTeamLead = req.user?.teamId === goal.teamId && 
    [UserRole.LEADER].includes(req.user?.role as UserRole);

  if (!isAdmin && !isOwner && !isTeamLead) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to delete this goal');
  }

  await prisma.goal.delete({
    where: { id },
  });

  res.status(StatusCodes.NO_CONTENT).send();
};