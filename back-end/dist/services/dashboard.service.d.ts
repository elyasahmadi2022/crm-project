export declare const DashboardService: {
    getOverview(): Promise<{
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
    }>;
};
//# sourceMappingURL=dashboard.service.d.ts.map