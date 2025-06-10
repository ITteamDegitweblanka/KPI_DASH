"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAllNotifications = exports.markAllNotificationsAsRead = exports.clearNotification = exports.markNotificationAsRead = exports.addNotification = exports.getUserNotifications = void 0;
const http_status_codes_1 = require("http-status-codes");
const prisma_1 = require("../utils/prisma");
const api_error_1 = require("../utils/api-error");
/**
 * Get all notifications for a user
 * @route GET /api/v1/notifications
 * @access Private
 */
const getUserNotifications = async (req, res) => {
    try {
        const { read, limit = '20', page = '1' } = req.query;
        const userId = req.user?.id;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const where = { userId };
        if (typeof read === 'string') {
            where.isRead = read === 'true';
        }
        const [notifications, total] = await Promise.all([
            prisma_1.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
            }),
            prisma_1.prisma.notification.count({ where })
        ]);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: notifications,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to retrieve notifications');
    }
};
exports.getUserNotifications = getUserNotifications;
/**
 * Add a new notification
 * @route POST /api/v1/notifications
 * @access Private/Admin
 */
const addNotification = async (req, res) => {
    try {
        const { userId, title, message, type = 'SYSTEM', data = {} } = req.body;
        const notificationData = {
            user: { connect: { id: userId } },
            title,
            message,
            type,
            ...(data && { link: data.link })
        };
        const notification = await prisma_1.prisma.notification.create({
            data: notificationData,
        });
        // TODO: Emit real-time notification if needed
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            data: notification,
        });
    }
    catch (error) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create notification');
    }
};
exports.addNotification = addNotification;
/**
 * Mark a notification as read
 * @route PATCH /api/v1/notifications/:id/read
 * @access Private
 */
const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const notification = await prisma_1.prisma.notification.findUnique({
            where: { id }
        });
        if (!notification) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Notification not found');
        }
        if (notification.userId !== userId) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to update this notification');
        }
        const updatedNotification = await prisma_1.prisma.notification.update({
            where: { id },
            data: {
                isRead: true
            },
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: updatedNotification,
        });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError)
            throw error;
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to mark notification as read');
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
/**
 * Delete a notification
 * @route DELETE /api/v1/notifications/:id
 * @access Private
 */
const clearNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const notification = await prisma_1.prisma.notification.findUnique({
            where: { id }
        });
        if (!notification) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Notification not found');
        }
        if (notification.userId !== userId) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to delete this notification');
        }
        await prisma_1.prisma.notification.delete({
            where: { id }
        });
        res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError)
            throw error;
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete notification');
    }
};
exports.clearNotification = clearNotification;
/**
 * Mark all notifications as read for the authenticated user
 * @route PATCH /api/v1/notifications/read-all
 * @access Private
 */
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { count } = await prisma_1.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false
            },
            data: {
                isRead: true
            },
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: { updatedCount: count },
        });
    }
    catch (error) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to mark all notifications as read');
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
/**
 * Delete all notifications for the authenticated user
 * @route DELETE /api/v1/notifications
 * @access Private
 */
const clearAllNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        await prisma_1.prisma.notification.deleteMany({
            where: { userId }
        });
        res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
    }
    catch (error) {
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to clear all notifications');
    }
};
exports.clearAllNotifications = clearAllNotifications;
