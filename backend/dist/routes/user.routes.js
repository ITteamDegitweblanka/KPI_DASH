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
const userController = __importStar(require("../controllers/user.controller"));
const authController = __importStar(require("../controllers/auth.controller"));
const error_middleware_1 = require("../middleware/error.middleware");
const types_1 = require("../types");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.authenticate);
/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', authController.getMe);
/**
 * @swagger
 * /api/v1/users/admins:
 *   get:
 *     summary: Get all admin users (Super Admin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of admin users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/admins', (0, auth_middleware_1.authorize)([types_1.UserRole.SUPER_ADMIN]), userController.getAdminUsers);
/**
 * @swagger
 * /api/v1/users/admins:
 *   post:
 *     summary: Add a new admin user (Super Admin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [ADMIN, SUPER_ADMIN]
 *                 default: ADMIN
 *     responses:
 *       201:
 *         description: Admin user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 */
router.post('/admins', (0, auth_middleware_1.authorize)([types_1.UserRole.SUPER_ADMIN]), [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('role')
        .optional()
        .isIn([types_1.UserRole.ADMIN, types_1.UserRole.SUPER_ADMIN])
        .withMessage('Invalid admin role'),
    error_middleware_1.validateRequest
], userController.addAdminUser);
/**
 * @swagger
 * /api/v1/users/{userId}/role:
 *   put:
 *     summary: Update user role (Admin or Super Admin)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [MEMBER, SUB_LEADER, LEADER, ADMIN, SUPER_ADMIN]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 */
router.put('/:userId/role', (0, auth_middleware_1.authorize)([types_1.UserRole.ADMIN, types_1.UserRole.SUPER_ADMIN]), [
    (0, express_validator_1.param)('userId').isUUID().withMessage('Valid user ID is required'),
    (0, express_validator_1.body)('role')
        .isIn([
        types_1.UserRole.MEMBER,
        types_1.UserRole.SUB_LEADER,
        types_1.UserRole.LEADER,
        types_1.UserRole.ADMIN,
        types_1.UserRole.SUPER_ADMIN
    ])
        .withMessage('Invalid role'),
    error_middleware_1.validateRequest
], userController.updateUserRole);
/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Staff, Sub-Leader, Leader, Admin, Super Admin]
 *         description: Filter by role
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by team ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('role').optional().isIn(Object.values(types_1.UserRole)),
    (0, express_validator_1.query)('teamId').optional().isUUID(),
    (0, express_validator_1.query)('search').optional().trim(),
], error_middleware_1.validateRequest, (0, auth_middleware_1.authorize)([types_1.UserRole.ADMIN, types_1.UserRole.SUPER_ADMIN]), userController.getUsers);
/**
 * @swagger
 * /api/v1/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:userId', [(0, express_validator_1.param)('userId').isUUID()], error_middleware_1.validateRequest, (0, auth_middleware_1.isOwnerOrAdmin)('userId'), userController.getUserById);
/**
 * @swagger
 * /api/v1/users/{userId}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               title:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               nationality:
 *                 type: string
 *               address:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               accessibilityNeeds:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:userId', [
    (0, express_validator_1.param)('userId').isUUID(),
    (0, express_validator_1.body)('displayName').optional().trim().notEmpty(),
    (0, express_validator_1.body)('title').optional().trim(),
    (0, express_validator_1.body)('phoneNumber').optional().trim(),
    (0, express_validator_1.body)('dateOfBirth').optional().isISO8601().toDate(),
    (0, express_validator_1.body)('nationality').optional().trim(),
    (0, express_validator_1.body)('address').optional().trim(),
    (0, express_validator_1.body)('avatarUrl').optional().trim().isURL(),
    (0, express_validator_1.body)('accessibilityNeeds').optional().trim(),
], error_middleware_1.validateRequest, (0, auth_middleware_1.isOwnerOrAdmin)('userId'), userController.updateUser);
/**
 * @swagger
 * /api/v1/users/{userId}/role:
 *   patch:
 *     summary: Update user role (Super Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [Staff, Sub-Leader, Leader, Admin]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:userId/role', [
    (0, express_validator_1.param)('userId').isUUID(),
    (0, express_validator_1.body)('role').isIn([
        types_1.UserRole.MEMBER,
        types_1.UserRole.SUB_LEADER,
        types_1.UserRole.LEADER,
        types_1.UserRole.ADMIN,
        types_1.UserRole.SUPER_ADMIN
    ]),
], error_middleware_1.validateRequest, auth_middleware_1.isSuperAdmin, userController.updateUserRole);
/**
 * @swagger
 * /api/v1/users/{userId}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:userId', [(0, express_validator_1.param)('userId').isUUID()], error_middleware_1.validateRequest, (0, auth_middleware_1.authorize)([types_1.UserRole.ADMIN, types_1.UserRole.SUPER_ADMIN]), userController.deleteUser);
exports.default = router;
