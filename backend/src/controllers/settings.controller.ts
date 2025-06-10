import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/api-error';

const prisma = new PrismaClient();

type ThemeSettings = {
  theme: 'light' | 'dark' | 'system';
  darkMode: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
};

type NotificationSettings = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  performanceUpdates: boolean;
  newsletter: boolean;
};

/**
 * Get user's theme settings
 * @route GET /api/v1/settings/theme
 * @access Private
 */
export const getThemeSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
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

    res.status(StatusCodes.OK).json({
      success: true,
      data: settings as ThemeSettings,
    });
  } catch (error) {
    console.error('Error getting theme settings:', error);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to retrieve theme settings'
    );
  }
};

/**
 * Update user's theme settings
 * @route PUT /api/v1/settings/theme
 * @access Private
 */
export const updateThemeSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
    }
    
    const { theme, darkMode, highContrast, fontSize } = req.body as Partial<ThemeSettings>;
    
    // Validate input
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid theme value');
    }
    
    if (fontSize && !['small', 'medium', 'large'].includes(fontSize)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid font size');
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

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedSettings as ThemeSettings,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error updating theme settings:', error);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to update theme settings'
    );
  }
};

/**
 * Get user's notification settings
 * @route GET /api/v1/settings/notifications
 * @access Private
 */
export const getNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
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

    res.status(StatusCodes.OK).json({
      success: true,
      data: settings as NotificationSettings,
    });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to retrieve notification settings'
    );
  }
};

/**
 * Update user's notification settings
 * @route PUT /api/v1/settings/notifications
 * @access Private
 */
export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
    }
    
    const { emailNotifications, pushNotifications, performanceUpdates, newsletter } = req.body as Partial<NotificationSettings>;

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

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedSettings as NotificationSettings,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error updating notification settings:', error);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to update notification settings'
    );
  }
};
