import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, isAdmin } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/error.middleware';
import * as performanceController from '../controllers/performance.controller';
import { PerformanceRating } from '@prisma/client';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PerformanceReview:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         employeeId:
 *           type: string
 *           format: uuid
 *         reviewerId:
 *           type: string
 *           format: uuid
 *         reviewDate:
 *           type: string
 *           format: date-time
 *         nextReviewDate:
 *           type: string
 *           format: date-time
 *         rating:
 *           $ref: '#/components/schemas/PerformanceRating'
 *         feedback:
 *           type: string
 *         strengths:
 *           type: object
 *         areasForImprovement:
 *           type: object
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     PerformanceRating:
 *       type: string
 *       enum: [EXCEEDS_EXPECTATIONS, MEETS_EXPECTATIONS, NEEDS_IMPROVEMENT, UNSATISFACTORY]
 * 
 *     PerformanceMetric:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         value:
 *           type: number
 *         target:
 *           type: number
 * 
 *     PerformanceMetrics:
 *       type: object
 *       properties:
 *         productivity:
 *           type: number
 *         quality:
 *           type: number
 *         attendance:
 *           type: number
 *         teamwork:
 *           type: number
 * 
 *     PerformanceResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             metrics:
 *               $ref: '#/components/schemas/PerformanceMetrics'
 *             overallScore:
 *               type: number
 *             period:
 *               type: string
 *             reviews:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PerformanceReview'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     pageSize:
 *                       type: number
 *                     totalPages:
 *                       type: number
 */

/**
 * @swagger
 * /api/v1/performance/employee/{employeeId}:
 *   get:
 *     summary: Get performance metrics for an employee
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the employee
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by review status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Employee performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PerformanceResponse'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/employee/:employeeId',
  [
    param('employeeId').isUUID().withMessage('Invalid employee ID'),
    query('status').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validateRequest
  ],
  performanceController.getEmployeePerformance
);

/**
 * @swagger
 * /api/v1/performance/team/{teamId}:
 *   get:
 *     summary: Get performance metrics for a team
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the team
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year, all]
 *           default: current
 *         description: Time period for performance data
 *     responses:
 *       200:
 *         description: Team performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PerformanceResponse'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/team/:teamId',
  [
    param('teamId').isUUID().withMessage('Invalid team ID'),
    query('period').optional().isString(),
    validateRequest
  ],
  performanceController.getTeamPerformance
);

/**
 * @swagger
 * /api/v1/performance/reviews:
 *   post:
 *     summary: Create a new performance review
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - reviewerId
 *               - reviewDate
 *               - nextReviewDate
 *               - rating
 *               - feedback
 *             properties:
 *               employeeId:
 *                 type: string
 *                 format: uuid
 *               reviewerId:
 *                 type: string
 *                 format: uuid
 *               reviewDate:
 *                 type: string
 *                 format: date-time
 *               nextReviewDate:
 *                 type: string
 *                 format: date-time
 *               rating:
 *                 $ref: '#/components/schemas/PerformanceRating'
 *               feedback:
 *                 type: string
 *               strengths:
 *                 type: object
 *               areasForImprovement:
 *                 type: object
 *     responses:
 *       201:
 *         description: Performance review created successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/reviews',
  [
    body('employeeId').isUUID().withMessage('Invalid employee ID'),
    body('reviewerId').isUUID().withMessage('Invalid reviewer ID'),
    body('reviewDate').isISO8601().toDate().withMessage('Invalid review date'),
    body('nextReviewDate').isISO8601().toDate().withMessage('Invalid next review date'),
    body('rating').isIn(Object.values(PerformanceRating)).withMessage('Invalid rating'),
    body('feedback').isString().notEmpty().withMessage('Feedback is required'),
    body('strengths').optional().isObject(),
    body('areasForImprovement').optional().isObject(),
    validateRequest
  ],
  isAdmin,
  performanceController.createPerformanceReview
);

/**
 * @swagger
 * /api/v1/performance/reviews/{id}:
 *   put:
 *     summary: Update a performance review
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the performance review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewerId:
 *                 type: string
 *                 format: uuid
 *               reviewDate:
 *                 type: string
 *                 format: date-time
 *               nextReviewDate:
 *                 type: string
 *                 format: date-time
 *               rating:
 *                 $ref: '#/components/schemas/PerformanceRating'
 *               feedback:
 *                 type: string
 *               strengths:
 *                 type: object
 *               areasForImprovement:
 *                 type: object
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Performance review updated successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Performance review not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/reviews/:id',
  [
    param('id').isUUID().withMessage('Invalid review ID'),
    body('reviewerId').optional().isUUID().withMessage('Invalid reviewer ID'),
    body('reviewDate').optional().isISO8601().toDate().withMessage('Invalid review date'),
    body('nextReviewDate').optional().isISO8601().toDate().withMessage('Invalid next review date'),
    body('rating').optional().isIn(Object.values(PerformanceRating)).withMessage('Invalid rating'),
    body('feedback').optional().isString().notEmpty().withMessage('Feedback cannot be empty'),
    body('strengths').optional().isObject(),
    body('areasForImprovement').optional().isObject(),
    body('isActive').optional().isBoolean(),
    validateRequest
  ],
  isAdmin,
  performanceController.updatePerformanceReview
);

/**
 * @swagger
 * /api/v1/performance/reviews/{id}:
 *   delete:
 *     summary: Delete a performance review
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the performance review
 *     responses:
 *       204:
 *         description: Performance review deleted successfully
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Performance review not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/reviews/:id',
  [
    param('id').isUUID().withMessage('Invalid review ID'),
    validateRequest
  ],
  isAdmin,
  performanceController.deletePerformanceReview
);

/**
 * @swagger
 * /api/v1/performance/reviews/{id}/finalize:
 *   post:
 *     summary: Finalize a performance review
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the performance review
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Performance review finalized successfully
 *       400:
 *         description: Invalid request or review already finalized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Performance review not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/reviews/:id/finalize',
  [
    param('id').isUUID().withMessage('Invalid review ID'),
    body('comments').optional().isString(),
    validateRequest
  ],
  performanceController.finalizePerformanceReview
);

/**
 * @swagger
 * /api/v1/performance/employees:
 *   get:
 *     summary: Get performance metrics for all employees
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics for all employees
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PerformanceResponse'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/employees',
  performanceController.getAllEmployeePerformance
);

// Add missing weekly and overall performance endpoints
router.get('/weekly', performanceController.getWeeklyPerformanceData);
router.get('/overall', performanceController.getOverallPerformanceData);

export default router;