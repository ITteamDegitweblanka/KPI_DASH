import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Prisma, NotificationType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { ApiError } from '../utils/api-error';

/**
 * Get all notifications for a user
 * @route GET /api/v1/notifications
 * @access Private
 */
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const { read, limit = '20', page = '1' } = req.query;
    const userId = req.user?.id;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.NotificationWhereInput = { userId };
    
    if (typeof read === 'string') {
      where.isRead = read === 'true';
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.notification.count({ where })
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to retrieve notifications'
    );
  }
};

/**
 * Add a new notification
 * @route POST /api/v1/notifications
 * @access Private/Admin
 */
export const addNotification = async (req: Request, res: Response) => {
  try {
    const { userId, title, message, type = 'SYSTEM', data = {} } = req.body;

    const notificationData: Prisma.NotificationCreateInput = {
      user: { connect: { id: userId } },
      title,
      message,
      type,
      ...(data && { link: data.link })
    };

    const notification = await prisma.notification.create({
      data: notificationData,
    });

    // TODO: Emit real-time notification if needed

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create notification'
    );
  }
};

/**
 * Mark a notification as read
 * @route PATCH /api/v1/notifications/:id/read
 * @access Private
 */
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to update this notification');
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { 
        isRead: true
      },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedNotification,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to mark notification as read'
    );
  }
};

/**
 * Delete a notification
 * @route DELETE /api/v1/notifications/:id
 * @access Private
 */
export const clearNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to delete this notification');
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to delete notification'
    );
  }
};

/**
 * Mark all notifications as read for the authenticated user
 * @route PATCH /api/v1/notifications/read-all
 * @access Private
 */
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const { count } = await prisma.notification.updateMany({
      where: { 
        userId,
        isRead: false 
      },
      data: { 
        isRead: true
      },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: { updatedCount: count },
    });
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to mark all notifications as read'
    );
  }
};

/**
 * Delete all notifications for the authenticated user
 * @route DELETE /api/v1/notifications
 * @access Private
 */
export const clearAllNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    await prisma.notification.deleteMany({
      where: { userId }
    });

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to clear all notifications'
    );
  }
};
