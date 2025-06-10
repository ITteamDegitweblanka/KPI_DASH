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
const performanceController = __importStar(require("../controllers/performance.controller"));
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
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
router.get('/employee/:employeeId', [
    (0, express_validator_1.param)('employeeId').isUUID().withMessage('Invalid employee ID'),
    (0, express_validator_1.query)('status').optional().isString(),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    error_middleware_1.validateRequest
], performanceController.getEmployeePerformance);
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
router.get('/team/:teamId', [
    (0, express_validator_1.param)('teamId').isUUID().withMessage('Invalid team ID'),
    (0, express_validator_1.query)('period').optional().isString(),
    error_middleware_1.validateRequest
], performanceController.getTeamPerformance);
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
router.post('/reviews', [
    (0, express_validator_1.body)('employeeId').isUUID().withMessage('Invalid employee ID'),
    (0, express_validator_1.body)('reviewerId').isUUID().withMessage('Invalid reviewer ID'),
    (0, express_validator_1.body)('reviewDate').isISO8601().toDate().withMessage('Invalid review date'),
    (0, express_validator_1.body)('nextReviewDate').isISO8601().toDate().withMessage('Invalid next review date'),
    (0, express_validator_1.body)('rating').isIn(Object.values(client_1.PerformanceRating)).withMessage('Invalid rating'),
    (0, express_validator_1.body)('feedback').isString().notEmpty().withMessage('Feedback is required'),
    (0, express_validator_1.body)('strengths').optional().isObject(),
    (0, express_validator_1.body)('areasForImprovement').optional().isObject(),
    error_middleware_1.validateRequest
], auth_middleware_1.isAdmin, performanceController.createPerformanceReview);
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
router.put('/reviews/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid review ID'),
    (0, express_validator_1.body)('reviewerId').optional().isUUID().withMessage('Invalid reviewer ID'),
    (0, express_validator_1.body)('reviewDate').optional().isISO8601().toDate().withMessage('Invalid review date'),
    (0, express_validator_1.body)('nextReviewDate').optional().isISO8601().toDate().withMessage('Invalid next review date'),
    (0, express_validator_1.body)('rating').optional().isIn(Object.values(client_1.PerformanceRating)).withMessage('Invalid rating'),
    (0, express_validator_1.body)('feedback').optional().isString().notEmpty().withMessage('Feedback cannot be empty'),
    (0, express_validator_1.body)('strengths').optional().isObject(),
    (0, express_validator_1.body)('areasForImprovement').optional().isObject(),
    (0, express_validator_1.body)('isActive').optional().isBoolean(),
    error_middleware_1.validateRequest
], auth_middleware_1.isAdmin, performanceController.updatePerformanceReview);
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
router.delete('/reviews/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid review ID'),
    error_middleware_1.validateRequest
], auth_middleware_1.isAdmin, performanceController.deletePerformanceReview);
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
router.post('/reviews/:id/finalize', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid review ID'),
    (0, express_validator_1.body)('comments').optional().isString(),
    error_middleware_1.validateRequest
], performanceController.finalizePerformanceReview);
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
router.get('/employees', performanceController.getAllEmployeePerformance);
// Add missing weekly and overall performance endpoints
router.get('/weekly', performanceController.getWeeklyPerformanceData);
router.get('/overall', performanceController.getOverallPerformanceData);
exports.default = router;
