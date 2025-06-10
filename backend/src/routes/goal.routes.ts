import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, isOwnerOrAdmin, isAdmin } from '../middleware/auth.middleware';
import * as goalController from '../controllers';
import { validateRequest } from '../middleware/error.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/goals/employee/{employeeId}:
 *   get:
 *     summary: Get goals for an employee
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the employee
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NOT_STARTED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED]
 *         description: Filter by goal status
 *     responses:
 *       200:
 *         description: List of employee goals
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view these goals
 *       404:
 *         description: Employee not found
 */
router.get(
  '/employee/:employeeId',
  [
    param('employeeId').isUUID().withMessage('Invalid employee ID'),
    isOwnerOrAdmin('employeeId')
  ],
  validateRequest,
  goalController.getEmployeeGoals
);

/**
 * @swagger
 * /api/v1/goals/team/{teamId}:
 *   get:
 *     summary: Get goals for a team (Admin only)
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the team
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NOT_STARTED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED]
 *         description: Filter by goal status
 *     responses:
 *       200:
 *         description: List of team goals
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Team not found
 */
router.get(
  '/team/:teamId',
  [
    param('teamId').isUUID().withMessage('Invalid team ID'),
    isAdmin
  ],
  validateRequest,
  goalController.getTeamGoals
);

/**
 * @swagger
 * /api/v1/goals/{id}:
 *   get:
 *     summary: Get a goal by ID
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Goal ID
 *     responses:
 *       200:
 *         description: Goal details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view this goal
 *       404:
 *         description: Goal not found
 */
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid goal ID')
  ],
  validateRequest,
  goalController.getGoalById
);

/**
 * @swagger
 * /api/v1/goals:
 *   post:
 *     summary: Create a new goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - targetDate
 *               - employeeId
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [PERFORMANCE, DEVELOPMENT, PROJECT, PERSONAL]
 *                 default: PERFORMANCE
 *               status:
 *                 type: string
 *                 enum: [NOT_STARTED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED]
 *                 default: NOT_STARTED
 *               progress:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 default: 0
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               targetDate:
 *                 type: string
 *                 format: date-time
 *               employeeId:
 *                 type: string
 *                 format: uuid
 *               teamId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Goal created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to create goal for this employee/team
 *       404:
 *         description: Employee/Team not found
 */
router.post(
  '/',
  [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
    body('description').optional().trim(),
    body('type').isIn(['PERFORMANCE', 'DEVELOPMENT', 'PROJECT', 'PERSONAL']).withMessage('Invalid goal type'),
    body('status').optional().isIn(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']),
    body('progress').optional().isInt({ min: 0, max: 100 }),
    body('startDate').optional().isISO8601(),
    body('targetDate').isISO8601().withMessage('Valid target date is required'),
    body('employeeId')
      .isUUID().withMessage('Valid employee ID is required')
      .custom((value, { req }) => {
        // At least one of employeeId or teamId must be provided
        if (!value && !req.body.teamId) {
          throw new Error('Either employeeId or teamId must be provided');
        }
        return true;
      }),
    body('teamId').optional().isUUID()
  ],
  validateRequest,
  goalController.createGoal
);

/**
 * @swagger
 * /api/v1/goals/{id}:
 *   put:
 *     summary: Update a goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Goal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [PERFORMANCE, DEVELOPMENT, PROJECT, PERSONAL]
 *               status:
 *                 type: string
 *                 enum: [NOT_STARTED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED]
 *               progress:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               targetDate:
 *                 type: string
 *                 format: date-time
 *               employeeId:
 *                 type: string
 *                 format: uuid
 *               teamId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Goal updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to update this goal
 *       404:
 *         description: Goal not found
 */
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Valid goal ID is required'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
    body('description').optional().trim(),
    body('type').optional().isIn(['PERFORMANCE', 'DEVELOPMENT', 'PROJECT', 'PERSONAL']),
    body('status').optional().isIn(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']),
    body('progress').optional().isInt({ min: 0, max: 100 }),
    body('startDate').optional().isISO8601(),
    body('targetDate').optional().isISO8601(),
    body('employeeId').optional().isUUID(),
    body('teamId').optional().isUUID()
  ],
  validateRequest,
  goalController.updateGoal
);

/**
 * @swagger
 * /api/v1/goals/{id}:
 *   delete:
 *     summary: Delete a goal (Admin or Goal Owner only)
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Goal ID
 *     responses:
 *       204:
 *         description: Goal deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to delete this goal
 *       404:
 *         description: Goal not found
 */
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Valid goal ID is required')
  ],
  validateRequest,
  goalController.deleteGoal
);

export default router;