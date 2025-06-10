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
const teamController = __importStar(require("../controllers/team.controller"));
const error_middleware_1 = require("../middleware/error.middleware");
const types_1 = require("../types");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.authenticate);
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
router.get('/', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('branchId').optional().isUUID(),
    (0, express_validator_1.query)('search').optional().trim(),
], error_middleware_1.validateRequest, teamController.getTeams);
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
router.get('/:teamId', [(0, express_validator_1.param)('teamId').isUUID()], error_middleware_1.validateRequest, teamController.getTeamById);
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
router.post('/', [
    (0, express_validator_1.body)('name').trim().notEmpty(),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('branchId').isUUID(),
    (0, express_validator_1.body)('leaderId').optional().isUUID(),
], error_middleware_1.validateRequest, (0, auth_middleware_1.authorize)([types_1.UserRole.ADMIN, types_1.UserRole.SUPER_ADMIN]), teamController.createTeam);
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
router.put('/:teamId', [
    (0, express_validator_1.param)('teamId').isUUID(),
    (0, express_validator_1.body)('name').optional().trim().notEmpty(),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('branchId').optional().isUUID(),
    (0, express_validator_1.body)('leaderId').optional().isUUID(),
], error_middleware_1.validateRequest, (0, auth_middleware_1.authorize)([types_1.UserRole.ADMIN, types_1.UserRole.SUPER_ADMIN]), teamController.updateTeam);
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
router.delete('/:teamId', [(0, express_validator_1.param)('teamId').isUUID()], error_middleware_1.validateRequest, (0, auth_middleware_1.authorize)([types_1.UserRole.ADMIN, types_1.UserRole.SUPER_ADMIN]), teamController.deleteTeam);
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
router.get('/:teamId/employees', [(0, express_validator_1.param)('teamId').isUUID()], error_middleware_1.validateRequest, teamController.getTeamEmployees);
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
router.post('/:teamId/members/:userId', [(0, express_validator_1.param)('teamId').isUUID(), (0, express_validator_1.param)('userId').isUUID()], error_middleware_1.validateRequest, (0, auth_middleware_1.authorize)([types_1.UserRole.ADMIN, types_1.UserRole.LEADER]), teamController.addTeamEmployee);
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
router.delete('/:teamId/members/:userId', [(0, express_validator_1.param)('teamId').isUUID(), (0, express_validator_1.param)('userId').isUUID()], error_middleware_1.validateRequest, (0, auth_middleware_1.authorize)([types_1.UserRole.ADMIN, types_1.UserRole.LEADER]), teamController.removeTeamEmployee);
exports.default = router;
