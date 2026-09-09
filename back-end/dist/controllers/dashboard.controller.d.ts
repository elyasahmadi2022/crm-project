import type { Request, Response, NextFunction } from 'express';
export declare const DashboardController: {
    /**
     * Get dashboard overview with aggregated stats from all modules
     * @route GET /api/v1/dashboard/overview
     */
    getOverview(req: Request, res: Response, next: NextFunction): Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<{
        stats: {
            label: string;
            value: string;
            trend: string;
            up: boolean;
            sub: string;
            icon: string;
            color: string;
        }[];
        projects: {
            id: number;
            name: string;
            customer: string;
            stage: any;
            team: string[];
            updated: string;
        }[];
        milestones: {
            id: number;
            title: string;
            project: string;
            dueDate: string | null | undefined;
            overdue: boolean;
        }[];
        leads: {
            id: number;
            name: string;
            company: string;
            status: any;
            days: number;
        }[];
        financeSnapshot: {
            totalInvoiced: string;
            totalPaid: string;
            totalOutstanding: string;
            totalOverdue: string;
            overdueInvoices: {
                id: number;
                customer: string;
                amount: string;
                days: number;
            }[];
        };
        campaigns: {
            id: number;
            name: string;
            budget: string;
            spend: string;
            leads: number;
            rate: string;
        }[];
        leadsChart: {
            month: string;
            new: number;
            contacted: number;
            won: number;
        }[];
    }>, Record<string, any>> | undefined>;
};
//# sourceMappingURL=dashboard.controller.d.ts.map