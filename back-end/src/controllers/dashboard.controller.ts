import type { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { sendSuccess } from '../utiles/api-response.utiles.js';

export const DashboardController = {
  /**
   * Get dashboard overview with aggregated stats from all modules
   * @route GET /api/v1/dashboard/overview
   */
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getOverview();
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },
};
