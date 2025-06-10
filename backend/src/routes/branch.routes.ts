import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as branchController from '../controllers/branch.controller';
import { validateRequest } from '../middleware/error.middleware';
import { UserRole } from '../types/index';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/branches/list:
 *   get:
 *     summary: Get all active branches (frontend-compatible)
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all active branches
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
 *                     $ref: '#/components/schemas/Branch'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/list', branchController.fetchBranches);

/**
 * @swagger
 * /api/v1/branches/add:
 *   post:
 *     summary: Add a new branch (frontend-compatible)
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Branch created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Branch'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Branch with this name already exists
 */
router.post(
  '/add',
  [
    body('name').trim().notEmpty().withMessage('Branch name is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('description').optional().trim(),
  ],
  validateRequest,
  authorize([UserRole.ADMIN]),
  branchController.addBranch
);

/**
 * @swagger
 * /api/v1/branches:
 *   get:
 *     summary: Get all branches with pagination and filtering
 *     tags: [Branches]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by branch name or location
 *     responses:
 *       200:
 *         description: List of branches with pagination
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
 *                     $ref: '#/components/schemas/Branch'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().trim(),
  ],
  validateRequest,
  branchController.getBranches
);

/**
 * @swagger
 * /api/v1/branches/{branchId}:
 *   get:
 *     summary: Get branch by ID
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch details with teams and members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Branch'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:branchId',
  [param('branchId').isUUID()],
  validateRequest,
  branchController.getBranch
);

/**
 * @swagger
 * /api/v1/branches:
 *   post:
 *     summary: Create a new branch (Admin only)
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Branch created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Branch'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('location').trim().notEmpty(),
    body('description').optional().trim(),
    body('contactNumber').optional().trim(),
    body('email').optional().trim().isEmail(),
    body('address').optional().trim(),
  ],
  validateRequest,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  branchController.createBranch
);

/**
 * @swagger
 * /api/v1/branches/{branchId}:
 *   put:
 *     summary: Update a branch (Admin only)
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Branch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               address:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Branch updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Branch'
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
  '/:branchId',
  [
    param('branchId').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('location').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('contactNumber').optional().trim(),
    body('email').optional().trim().isEmail(),
    body('address').optional().trim(),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  branchController.updateBranch
);

/**
 * @swagger
 * /api/v1/branches/{branchId}:
 *   delete:
 *     summary: Delete a branch (Super Admin only)
 *     description: |
 *       Only Super Admins can delete branches. 
 *       The branch must not have any active teams to be deleted.
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Branch ID to delete
 *     responses:
 *       204:
 *         description: Branch deleted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Branch has active teams and cannot be deleted
 */
router.delete(
  '/:branchId',
  [param('branchId').isUUID()],
  validateRequest,
  authorize([UserRole.SUPER_ADMIN]),
  branchController.deleteBranch
);

export default router;
