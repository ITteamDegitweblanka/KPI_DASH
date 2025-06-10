"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const settingsController = __importStar(require("../controllers/settings.controller"));
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.authenticate);
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
router.get('/theme', settingsController.getThemeSettings);
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
router.put('/theme', [
    (0, express_validator_1.body)('theme').isIn(['light', 'dark', 'system']).withMessage('Theme must be light, dark, or system'),
    error_middleware_1.validateRequest
], settingsController.updateThemeSettings);
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
router.get('/notifications', settingsController.getNotificationSettings);
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
router.put('/notifications', [
    (0, express_validator_1.body)('emailNotifications').optional().isBoolean(),
    (0, express_validator_1.body)('pushNotifications').optional().isBoolean(),
    (0, express_validator_1.body)('performanceUpdates').optional().isBoolean(),
    (0, express_validator_1.body)('newsletter').optional().isBoolean(),
    error_middleware_1.validateRequest
], settingsController.updateNotificationSettings);
exports.default = router;
