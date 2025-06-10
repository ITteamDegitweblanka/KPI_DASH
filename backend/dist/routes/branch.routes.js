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
const branchController = __importStar(require("../controllers/branch.controller"));
const error_middleware_1 = require("../middleware/error.middleware");
const index_1 = require("../types/index");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.authenticate);
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
router.post('/add', [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Branch name is required'),
    (0, express_validator_1.body)('location').trim().notEmpty().withMessage('Location is required'),
    (0, express_validator_1.body)('description').optional().trim(),
], error_middleware_1.validateRequest, (0, auth_middleware_1.authorize)([index_1.UserRole.ADMIN]), branchController.addBranch);
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
router.get('/', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('search').optional().trim(),
], error_middleware_1.validateRequest, branchController.getBranches);
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
router.get('/:branchId', [(0, express_validator_1.param)('branchId').isUUID()], error_middleware_1.validateRequest, branchController.getBranch);
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
router.post('/', [
    (0, express_validator_1.body)('name').trim().notEmpty(),
    (0, express_validator_1.body)('location').trim().notEmpty(),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('contactNumber').optional().trim(),
    (0, express_validator_1.body)('email').optional().trim().isEmail(),
    (0, express_validator_1.body)('address').optional().trim(),
], error_middleware_1.validateRequest, (0, auth_middleware_1.authorize)([index_1.UserRole.ADMIN, index_1.UserRole.SUPER_ADMIN]), branchController.createBranch);
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
router.put('/:branchId', [
    (0, express_validator_1.param)('branchId').isUUID(),
    (0, express_validator_1.body)('name').optional().trim().notEmpty(),
    (0, express_validator_1.body)('location').optional().trim().notEmpty(),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('contactNumber').optional().trim(),
    (0, express_validator_1.body)('email').optional().trim().isEmail(),
    (0, express_validator_1.body)('address').optional().trim(),
    (0, express_validator_1.body)('isActive').optional().isBoolean(),
], error_middleware_1.validateRequest, (0, auth_middleware_1.authorize)([index_1.UserRole.ADMIN, index_1.UserRole.SUPER_ADMIN]), branchController.updateBranch);
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
router.delete('/:branchId', [(0, express_validator_1.param)('branchId').isUUID()], error_middleware_1.validateRequest, (0, auth_middleware_1.authorize)([index_1.UserRole.SUPER_ADMIN]), branchController.deleteBranch);
exports.default = router;
