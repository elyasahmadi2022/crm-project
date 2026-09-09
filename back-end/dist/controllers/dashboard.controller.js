import { DashboardService } from '../services/dashboard.service.js';
import { sendSuccess } from '../utiles/api-response.utiles.js';
export const DashboardController = {
    /**
     * Get dashboard overview with aggregated stats from all modules
     * @route GET /api/v1/dashboard/overview
     */
    async getOverview(req, res, next) {
        try {
            const data = await DashboardService.getOverview();
            return sendSuccess(res, data);
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=dashboard.controller.js.map