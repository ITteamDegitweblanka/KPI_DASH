import { Router } from 'express';
import { query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/error.middleware';
import kpiController from '../controllers/kpi.controller.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TeamKpiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             teamId:
 *               type: string
 *               format: uuid
 *             period:
 *               type: object
 *               properties:
 *                 start:
 *                   type: string
 *                   format: date
 *                 end:
 *                   type: string
 *                   format: date
 *                 label:
 *                   type: string
 *             metrics:
 *               type: object
 *               properties:
 *                 averageProductivity:
 *                   type: number
 *                   format: float
 *                 averageQuality:
 *                   type: number
 *                   format: float
 *                 averageAttendance:
 *                   type: number
 *                   format: float
 *                 averageTeamwork:
 *                   type: number
 *                   format: float
 *                 overallScore:
 *                   type: number
 *                   format: float
 *             members:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TeamMemberKpi'
 *             totalMembers:
 *               type: integer
 *             membersWithReviews:
 *               type: integer
 *             lastUpdated:
 *               type: string
 *               format: date-time
 *             scoreDistribution:
 *               type: object
 *               properties:
 *                 excellent:
 *                   type: integer
 *                 good:
 *                   type: integer
 *                 average:
 *                   type: integer
 *                 needsImprovement:
 *                   type: integer
 *             trend:
 *               type: string
 *             comparison:
 *               type: object
 *               properties:
 *                 teamAverage:
 *                   type: number
 *                 companyAverage:
 *                   type: number
 *                 industryBenchmark:
 *                   type: number
 * 
 *     TeamMemberKpi:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         avatarUrl:
 *           type: string
 *         title:
 *           type: string
 *         role:
 *           type: string
 *         teamId:
 *           type: string
 *         reviewCount:
 *           type: integer
 *         latestReviewDate:
 *           type: string
 *           format: date-time
 *         score:
 *           type: number
 *         metrics:
 *           type: object
 *           additionalProperties:
 *             type: number
 *         status:
 *           type: string
 *         lastReviewScore:
 *           type: number
 *         trend:
 *           type: string
 */

/**
 * @swagger
 * /api/v1/kpis/team:
 *   get:
 *     summary: Get team KPI metrics
 *     description: Get key performance indicators for the authenticated user's team
 *     tags: [KPIs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year, all]
 *           default: month
 *         description: The time period to get KPI data for
 *     responses:
 *       200:
 *         description: Team KPI data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamKpiResponse'
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User doesn't have permission to access team KPIs
 *       500:
 *         description: Internal server error
 */
router.get(
  '/team',
  authenticate,
  [
    query('period')
      .optional()
      .isIn(['week', 'month', 'quarter', 'year', 'all'])
      .withMessage('Period must be one of: week, month, quarter, year, all'),
  ],
  validateRequest,
  kpiController.getTeamKpis
);

export default router;
