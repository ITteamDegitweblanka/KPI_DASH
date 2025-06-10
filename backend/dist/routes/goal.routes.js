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
const goalController = __importStar(require("../controllers"));
const error_middleware_1 = require("../middleware/error.middleware");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.authenticate);
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
router.get('/employee/:employeeId', [
    (0, express_validator_1.param)('employeeId').isUUID().withMessage('Invalid employee ID'),
    (0, auth_middleware_1.isOwnerOrAdmin)('employeeId')
], error_middleware_1.validateRequest, goalController.getEmployeeGoals);
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
router.get('/team/:teamId', [
    (0, express_validator_1.param)('teamId').isUUID().withMessage('Invalid team ID'),
    auth_middleware_1.isAdmin
], error_middleware_1.validateRequest, goalController.getTeamGoals);
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
router.get('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid goal ID')
], error_middleware_1.validateRequest, goalController.getGoalById);
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
router.post('/', [
    (0, express_validator_1.body)('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('type').isIn(['PERFORMANCE', 'DEVELOPMENT', 'PROJECT', 'PERSONAL']).withMessage('Invalid goal type'),
    (0, express_validator_1.body)('status').optional().isIn(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']),
    (0, express_validator_1.body)('progress').optional().isInt({ min: 0, max: 100 }),
    (0, express_validator_1.body)('startDate').optional().isISO8601(),
    (0, express_validator_1.body)('targetDate').isISO8601().withMessage('Valid target date is required'),
    (0, express_validator_1.body)('employeeId')
        .isUUID().withMessage('Valid employee ID is required')
        .custom((value, { req }) => {
        // At least one of employeeId or teamId must be provided
        if (!value && !req.body.teamId) {
            throw new Error('Either employeeId or teamId must be provided');
        }
        return true;
    }),
    (0, express_validator_1.body)('teamId').optional().isUUID()
], error_middleware_1.validateRequest, goalController.createGoal);
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
router.put('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid goal ID is required'),
    (0, express_validator_1.body)('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('type').optional().isIn(['PERFORMANCE', 'DEVELOPMENT', 'PROJECT', 'PERSONAL']),
    (0, express_validator_1.body)('status').optional().isIn(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']),
    (0, express_validator_1.body)('progress').optional().isInt({ min: 0, max: 100 }),
    (0, express_validator_1.body)('startDate').optional().isISO8601(),
    (0, express_validator_1.body)('targetDate').optional().isISO8601(),
    (0, express_validator_1.body)('employeeId').optional().isUUID(),
    (0, express_validator_1.body)('teamId').optional().isUUID()
], error_middleware_1.validateRequest, goalController.updateGoal);
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
router.delete('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid goal ID is required')
], error_middleware_1.validateRequest, goalController.deleteGoal);
exports.default = router;
