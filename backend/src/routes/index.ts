import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import branchRoutes from './branch.routes';
import teamRoutes from './team.routes';
import goalRoutes from './goal.routes';
import performanceRoutes from './performance.routes';
import kpiRoutes from './kpi.routes';
import notificationRoutes from './notification.routes';
import settingsRoutes from './settings.routes';
import { config } from '../config';

const router = Router();

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
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/branches', branchRoutes);
router.use('/teams', teamRoutes);
router.use('/goals', goalRoutes);
router.use('/performance', performanceRoutes);
router.use('/kpis', kpiRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);

// 404 handler for API routes
router.use('/*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

export const apiRouter = router;