"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationSettings = exports.getNotificationSettings = exports.updateThemeSettings = exports.getThemeSettings = void 0;
const http_status_codes_1 = require("http-status-codes");
const client_1 = require("@prisma/client");
const api_error_1 = require("../utils/api-error");
const prisma = new client_1.PrismaClient();
/**
 * Get user's theme settings
 * @route GET /api/v1/settings/theme
 * @access Private
 */
const getThemeSettings = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'User not authenticated');
        }
        // Find or create user settings
        let settings = await prisma.userSettings.findFirst({
            where: { userId: userId },
            select: {
                theme: true,
                darkMode: true,
                highContrast: true,
                fontSize: true,
            },
        });
        // If no settings exist, create default settings
        if (!settings) {
            settings = await prisma.userSettings.create({
                data: {
                    userId: userId,
                    theme: 'system',
                    darkMode: false,
                    highContrast: false,
                    fontSize: 'medium',
                    emailNotifications: true,
                    pushNotifications: true,
                    performanceUpdates: true,
                    newsletter: false,
                    language: 'en',
                },
                select: {
                    theme: true,
                    darkMode: true,
                    highContrast: true,
                    fontSize: true,
                },
            });
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: settings,
        });
    }
    catch (error) {
        console.error('Error getting theme settings:', error);
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to retrieve theme settings');
    }
};
exports.getThemeSettings = getThemeSettings;
/**
 * Update user's theme settings
 * @route PUT /api/v1/settings/theme
 * @access Private
 */
const updateThemeSettings = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'User not authenticated');
        }
        const { theme, darkMode, highContrast, fontSize } = req.body;
        // Validate input
        if (theme && !['light', 'dark', 'system'].includes(theme)) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid theme value');
        }
        if (fontSize && !['small', 'medium', 'large'].includes(fontSize)) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid font size');
        }
        // Update or create settings
        const updatedSettings = await prisma.userSettings.upsert({
            where: { userId: userId },
            update: {
                ...(theme && { theme }),
                ...(darkMode !== undefined && { darkMode }),
                ...(highContrast !== undefined && { highContrast }),
                ...(fontSize && { fontSize }),
            },
            create: {
                userId: userId,
                theme: theme || 'system',
                darkMode: darkMode ?? false,
                highContrast: highContrast ?? false,
                fontSize: fontSize || 'medium',
                emailNotifications: true,
                pushNotifications: true,
                performanceUpdates: true,
                newsletter: false,
                language: 'en',
            },
            select: {
                theme: true,
                darkMode: true,
                highContrast: true,
                fontSize: true,
            },
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: updatedSettings,
        });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError)
            throw error;
        console.error('Error updating theme settings:', error);
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update theme settings');
    }
};
exports.updateThemeSettings = updateThemeSettings;
/**
 * Get user's notification settings
 * @route GET /api/v1/settings/notifications
 * @access Private
 */
const getNotificationSettings = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'User not authenticated');
        }
        // Find or create user settings
        let settings = await prisma.userSettings.findFirst({
            where: { userId: userId },
            select: {
                emailNotifications: true,
                pushNotifications: true,
                performanceUpdates: true,
                newsletter: true,
            },
        });
        // If no settings exist, create default settings
        if (!settings) {
            settings = await prisma.userSettings.create({
                data: {
                    userId: userId,
                    theme: 'system',
                    darkMode: false,
                    highContrast: false,
                    fontSize: 'medium',
                    emailNotifications: true,
                    pushNotifications: true,
                    performanceUpdates: true,
                    newsletter: false,
                    language: 'en',
                },
                select: {
                    emailNotifications: true,
                    pushNotifications: true,
                    performanceUpdates: true,
                    newsletter: true,
                },
            });
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: settings,
        });
    }
    catch (error) {
        console.error('Error getting notification settings:', error);
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to retrieve notification settings');
    }
};
exports.getNotificationSettings = getNotificationSettings;
/**
 * Update user's notification settings
 * @route PUT /api/v1/settings/notifications
 * @access Private
 */
const updateNotificationSettings = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'User not authenticated');
        }
        const { emailNotifications, pushNotifications, performanceUpdates, newsletter } = req.body;
        // Update or create settings
        const updatedSettings = await prisma.userSettings.upsert({
            where: { userId: userId },
            update: {
                ...(emailNotifications !== undefined && { emailNotifications }),
                ...(pushNotifications !== undefined && { pushNotifications }),
                ...(performanceUpdates !== undefined && { performanceUpdates }),
                ...(newsletter !== undefined && { newsletter }),
            },
            create: {
                userId: userId,
                theme: 'system',
                darkMode: false,
                highContrast: false,
                fontSize: 'medium',
                emailNotifications: emailNotifications ?? true,
                pushNotifications: pushNotifications ?? true,
                performanceUpdates: performanceUpdates ?? true,
                newsletter: newsletter ?? false,
                language: 'en',
            },
            select: {
                emailNotifications: true,
                pushNotifications: true,
                performanceUpdates: true,
                newsletter: true,
            },
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: updatedSettings,
        });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError)
            throw error;
        console.error('Error updating notification settings:', error);
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update notification settings');
    }
};
exports.updateNotificationSettings = updateNotificationSettings;
