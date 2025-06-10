"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const branch_routes_1 = __importDefault(require("./branch.routes"));
const team_routes_1 = __importDefault(require("./team.routes"));
const goal_routes_1 = __importDefault(require("./goal.routes"));
const performance_routes_1 = __importDefault(require("./performance.routes"));
const notification_routes_1 = __importDefault(require("./notification.routes"));
const settings_routes_1 = __importDefault(require("./settings.routes"));
const router = (0, express_1.Router)();
// Health check route
router.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Service is healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
    });
});
// API routes
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/branches', branch_routes_1.default);
router.use('/teams', team_routes_1.default);
router.use('/goals', goal_routes_1.default);
router.use('/performance', performance_routes_1.default);
router.use('/notifications', notification_routes_1.default);
router.use('/settings', settings_routes_1.default);
// 404 handler for API routes
router.use('/*', (_req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
    });
});
exports.apiRouter = router;
