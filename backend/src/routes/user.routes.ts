import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize, isOwnerOrAdmin, isSuperAdmin } from '../middleware/auth.middleware';
import * as userController from '../controllers/user.controller';
import * as authController from '../controllers/auth.controller';
import { validateRequest } from '../middleware/error.middleware';
import { UserRole } from '../types';
import { checkSchema } from 'express-validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

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
router.get(
  '/admins',
  authorize([UserRole.SUPER_ADMIN]),
  userController.getAdminUsers
);

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
router.post(
  '/admins',
  authorize([UserRole.SUPER_ADMIN]),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('role')
      .optional()
      .isIn([UserRole.ADMIN, UserRole.SUPER_ADMIN])
      .withMessage('Invalid admin role'),
    validateRequest
  ],
  userController.addAdminUser
);

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
router.put(
  '/:userId/role',
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    body('role')
      .isIn([
        UserRole.MEMBER,
        UserRole.SUB_LEADER,
        UserRole.LEADER,
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN
      ])
      .withMessage('Invalid role'),
    validateRequest
  ],
  userController.updateUserRole
);

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
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('role').optional().isIn(Object.values(UserRole)),
    query('teamId').optional().isUUID(),
    query('search').optional().trim(),
  ],
  validateRequest,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  userController.getUsers
);

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
router.get(
  '/:userId',
  [param('userId').isUUID()],
  validateRequest,
  isOwnerOrAdmin('userId'),
  userController.getUserById
);

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
router.put(
  '/:userId',
  [
    param('userId').isUUID(),
    body('displayName').optional().trim().notEmpty(),
    body('title').optional().trim(),
    body('phoneNumber').optional().trim(),
    body('dateOfBirth').optional().isISO8601().toDate(),
    body('nationality').optional().trim(),
    body('address').optional().trim(),
    body('avatarUrl').optional().trim().isURL(),
    body('accessibilityNeeds').optional().trim(),
  ],
  validateRequest,
  isOwnerOrAdmin('userId'),
  userController.updateUser
);

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
router.patch(
  '/:userId/role',
  [
    param('userId').isUUID(),
    body('role').isIn([
      UserRole.MEMBER,
      UserRole.SUB_LEADER,
      UserRole.LEADER,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN
    ]),
  ],
  validateRequest,
  isSuperAdmin,
  userController.updateUserRole
);

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
router.delete(
  '/:userId',
  [param('userId').isUUID()],
  validateRequest,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  userController.deleteUser
);

export default router;