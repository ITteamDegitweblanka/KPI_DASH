import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as teamController from '../controllers/team.controller';
import { validateRequest } from '../middleware/error.middleware';
import { UserRole } from '../types';
import { Prisma } from '@prisma/client';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/teams:
 *   get:
 *     summary: Get all teams with pagination and filtering
 *     tags: [Teams]
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
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by team name
 *     responses:
 *       200:
 *         description: List of teams with pagination
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
 *                     $ref: '#/components/schemas/Team'
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
    query('branchId').optional().isUUID(),
    query('search').optional().trim(),
  ],
  validateRequest,
  teamController.getTeams
);

/**
 * @swagger
 * /api/v1/teams/{teamId}:
 *   get:
 *     summary: Get team by ID
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team details with members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:teamId',
  [param('teamId').isUUID()],
  validateRequest,
  teamController.getTeamById
);

/**
 * @swagger
 * /api/v1/teams:
 *   post:
 *     summary: Create a new team (Admin only)
 *     tags: [Teams]
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
 *               - branchId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               branchId:
 *                 type: string
 *                 format: uuid
 *               leaderId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Team'
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
    body('description').optional().trim(),
    body('branchId').isUUID(),
    body('leaderId').optional().isUUID(),
  ],
  validateRequest,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  teamController.createTeam
);

/**
 * @swagger
 * /api/v1/teams/{teamId}:
 *   put:
 *     summary: Update a team (Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               branchId:
 *                 type: string
 *                 format: uuid
 *               leaderId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Team updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Team'
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
  '/:teamId',
  [
    param('teamId').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('branchId').optional().isUUID(),
    body('leaderId').optional().isUUID(),
  ],
  validateRequest,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  teamController.updateTeam
);

/**
 * @swagger
 * /api/v1/teams/{teamId}:
 *   delete:
 *     summary: Delete a team (Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       204:
 *         description: Team deleted successfully
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
  '/:teamId',
  [param('teamId').isUUID()],
  validateRequest,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  teamController.deleteTeam
);

/**
 * @swagger
 * /api/v1/teams/{teamId}/employees:
 *   get:
 *     summary: Get team employees
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: List of team employees
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:teamId/employees',
  [param('teamId').isUUID()],
  validateRequest,
  teamController.getTeamEmployees
);

/**
 * @swagger
 * /api/v1/teams/{teamId}/members/{userId}:
 *   post:
 *     summary: Add employee to team (Admin/Leader only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to add to the team
 *     responses:
 *       200:
 *         description: Employee added to team successfully
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
router.post(
  '/:teamId/members/:userId',
  [param('teamId').isUUID(), param('userId').isUUID()],
  validateRequest,
  authorize([UserRole.ADMIN, UserRole.LEADER]),
  teamController.addTeamEmployee
);

/**
 * @swagger
 * /api/v1/teams/{teamId}/members/{userId}:
 *   delete:
 *     summary: Remove employee from team (Admin/Leader only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to remove from the team
 *     responses:
 *       204:
 *         description: Employee removed from team successfully
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
  '/:teamId/members/:userId',
  [param('teamId').isUUID(), param('userId').isUUID()],
  validateRequest,
  authorize([UserRole.ADMIN, UserRole.LEADER]),
  teamController.removeTeamEmployee
);

export default router;
