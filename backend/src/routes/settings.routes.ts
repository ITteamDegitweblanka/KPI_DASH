import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/error.middleware';
import * as settingsController from '../controllers/settings.controller';
import { UserRole } from '../types';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/settings/theme:
 *   get:
 *     summary: Get user's theme preference
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Theme preference retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ThemeSettings'
 */
router.get(
  '/theme',
  settingsController.getThemeSettings
);

/**
 * @swagger
 * /api/v1/settings/theme:
 *   put:
 *     summary: Update user's theme preference
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateThemeSettings'
 *     responses:
 *       200:
 *         description: Theme preference updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ThemeSettings'
 */
router.put(
  '/theme',
  [
    body('theme').isIn(['light', 'dark', 'system']).withMessage('Theme must be light, dark, or system'),
    validateRequest
  ],
  settingsController.updateThemeSettings
);

/**
 * @swagger
 * /api/v1/settings/notifications:
 *   get:
 *     summary: Get user's notification preferences
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationSettings'
 */
router.get(
  '/notifications',
  settingsController.getNotificationSettings
);

/**
 * @swagger
 * /api/v1/settings/notifications:
 *   put:
 *     summary: Update user's notification preferences
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNotificationSettings'
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationSettings'
 */
router.put(
  '/notifications',
  [
    body('emailNotifications').optional().isBoolean(),
    body('pushNotifications').optional().isBoolean(),
    body('performanceUpdates').optional().isBoolean(),
    body('newsletter').optional().isBoolean(),
    validateRequest
  ],
  settingsController.updateNotificationSettings
);

export default router;
