import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.meddleware.js';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/dashboard/overview
 * @desc    Get dashboard overview with aggregated stats
 * @access  Private
 */
router.get('/overview', DashboardController.getOverview);

export default router;
