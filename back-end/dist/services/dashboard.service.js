import { prisma } from '../lib/primsa.js';
export const DashboardService = {
    async getOverview() {
        // Run all queries in parallel for better performance
        const [projects, leads, invoices, expenses, campaigns, projectMilestones,] = await Promise.all([
            // Projects - get all active projects (not in LIVE stage which means completed)
            prisma.project.findMany({
                include: {
                    customer: { select: { companyName: true } },
                    assignments: {
                        select: {
                            employee: { select: { name: true } }
                        }
                    },
                },
                orderBy: { updatedAt: 'desc' },
                take: 10,
            }),
            // Leads
            prisma.lead.findMany({
                include: {
                    owner: { select: { name: true } },
                    campaign: { select: { name: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            // Invoices
            prisma.invoice.findMany({
                include: {
                    customer: { select: { companyName: true } },
                    payments: true,
                },
                orderBy: { issueDate: 'desc' },
            }),
            // Expenses (all for campaign calculations)
            prisma.expense.findMany(),
            // Campaigns
            prisma.campaign.findMany({
                where: { status: { in: ['PLANNED', 'ACTIVE', 'PAUSED'] } },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            // Project milestones
            prisma.milestone.findMany({
                where: {
                    dueDate: {
                        lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Next 14 days
                    },
                },
                include: {
                    project: { select: { name: true } },
                },
                orderBy: { dueDate: 'asc' },
                take: 10,
            }),
        ]);
        // Calculate stats
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        // Active projects (not in LIVE stage)
        const activeProjectsCount = projects.filter(p => ['REQUIREMENTS', 'DESIGN', 'DEVELOPMENT', 'TESTING', 'DEPLOYMENT'].includes(p.stage)).length;
        const lastMonthProjects = await prisma.project.count({
            where: {
                stage: { in: ['REQUIREMENTS', 'DESIGN', 'DEVELOPMENT', 'TESTING', 'DEPLOYMENT'] },
                createdAt: { gte: lastMonth, lt: thisMonthStart },
            },
        });
        // Open leads
        const openLeadsCount = leads.filter(l => ['NEW', 'CONTACTED', 'PENDING'].includes(l.status)).length;
        const lastMonthLeads = await prisma.lead.count({
            where: {
                status: { in: ['NEW', 'CONTACTED', 'PENDING'] },
                createdAt: { gte: lastMonth, lt: thisMonthStart },
            },
        });
        // Revenue this month (paid invoices)
        const thisMonthInvoices = invoices.filter(inv => inv.issueDate && inv.issueDate >= thisMonthStart);
        // Calculate total paid amount from payments
        const revenueByCurrency = invoices
            .filter(inv => inv.issueDate && inv.issueDate >= thisMonthStart)
            .reduce((totals, inv) => {
            const totalPaid = inv.payments.reduce((pSum, p) => pSum + parseFloat(p.amount.toString()), 0);
            totals[inv.currency] = (totals[inv.currency] ?? 0) + totalPaid;
            return totals;
        }, {});
        const lastMonthInvoicesData = await prisma.invoice.findMany({
            where: {
                issueDate: { gte: lastMonth, lt: thisMonthStart },
            },
            include: { payments: true },
        });
        const lastMonthRevenueByCurrency = lastMonthInvoicesData.reduce((totals, inv) => {
            const totalPaid = inv.payments.reduce((pSum, p) => pSum + parseFloat(p.amount.toString()), 0);
            totals[inv.currency] = (totals[inv.currency] ?? 0) + totalPaid;
            return totals;
        }, {});
        const revenueThisMonth = Object.values(revenueByCurrency).reduce((sum, value) => sum + value, 0);
        const lastMonthRevenue = Object.values(lastMonthRevenueByCurrency).reduce((sum, value) => sum + value, 0);
        const revenueLabel = Object.entries(revenueByCurrency).map(([currency, value]) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`).join(' / ') || '0.00';
        const revenueTrendLabel = Object.entries(revenueByCurrency).map(([currency, value]) => {
            const previous = lastMonthRevenueByCurrency[currency] ?? 0;
            const trend = previous > 0 ? ((value - previous) / previous * 100).toFixed(1) : '0.0';
            return `${trend}% ${currency}`;
        }).join(' / ') || '+0%';
        // Overdue invoices - invoices past due date with unpaid balance
        const overdueInvoices = invoices.filter(inv => {
            if (!inv.dueDate || inv.status === 'PAID')
                return false;
            const totalPaid = inv.payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
            const balance = parseFloat(inv.amount.toString()) - totalPaid;
            return inv.dueDate < now && balance > 0;
        });
        const overdueCount = overdueInvoices.length;
        // Calculate stats with trends
        const stats = [
            {
                label: "Active Projects",
                value: activeProjectsCount.toString(),
                trend: `+${activeProjectsCount - lastMonthProjects}`,
                up: activeProjectsCount >= lastMonthProjects,
                sub: "vs last month",
                icon: "Briefcase",
                color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
            },
            {
                label: "Open Leads",
                value: openLeadsCount.toString(),
                trend: `+${openLeadsCount - lastMonthLeads}`,
                up: openLeadsCount >= lastMonthLeads,
                sub: "vs last month",
                icon: "TrendingUp",
                color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
            },
            {
                label: "Revenue This Month",
                value: revenueLabel,
                trend: revenueTrendLabel,
                up: revenueThisMonth >= lastMonthRevenue,
                sub: "vs last month",
                icon: "DollarSign",
                color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
            },
            {
                label: "Overdue Invoices",
                value: overdueCount.toString(),
                trend: `${overdueCount}`,
                up: false,
                sub: "need attention",
                icon: "AlertTriangle",
                color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
            },
        ];
        // Format projects for frontend
        const formattedProjects = projects.slice(0, 5).map(p => {
            const teamInitials = p.assignments.map(a => {
                const nameParts = a.employee.name.split(' ');
                return nameParts.length >= 2
                    ? `${nameParts[0][0] ?? ''}${nameParts[1][0] ?? ''}`
                    : (nameParts[0] ?? '').substring(0, 2).toUpperCase();
            });
            const updatedDiff = Math.floor((now.getTime() - p.updatedAt.getTime()) / (1000 * 60 * 60));
            let updatedStr = '';
            if (updatedDiff < 1)
                updatedStr = 'Just now';
            else if (updatedDiff < 24)
                updatedStr = `${updatedDiff}h ago`;
            else
                updatedStr = `${Math.floor(updatedDiff / 24)}d ago`;
            return {
                id: p.id,
                name: p.name,
                customer: p.customer.companyName,
                stage: p.stage,
                team: teamInitials,
                updated: updatedStr,
            };
        });
        // Format milestones
        const formattedMilestones = projectMilestones.map(m => ({
            id: m.id,
            title: m.title,
            project: m.project.name,
            dueDate: m.dueDate ? m.dueDate.toISOString().split('T')[0] : null,
            overdue: m.dueDate ? m.dueDate < now : false,
        }));
        // Format leads by status
        const formattedLeads = leads.map(l => {
            const daysDiff = Math.floor((now.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            return {
                id: l.id,
                name: l.name,
                company: l.companyName,
                status: l.status,
                days: daysDiff,
            };
        });
        // Calculate finance snapshot
        const totalsByCurrency = invoices.reduce((totals, inv) => {
            const paid = inv.payments.reduce((pSum, p) => pSum + parseFloat(p.amount.toString()), 0);
            const current = totals[inv.currency] ?? { invoiced: 0, paid: 0, outstanding: 0, overdue: 0 };
            current.invoiced += parseFloat(inv.amount.toString());
            current.paid += paid;
            if (!inv.dueDate || inv.status === 'PAID') {
                totals[inv.currency] = current;
                return totals;
            }
            const balance = parseFloat(inv.amount.toString()) - paid;
            const isOverdue = inv.dueDate < now;
            if (isOverdue)
                current.overdue += balance;
            else
                current.outstanding += balance;
            totals[inv.currency] = current;
            return totals;
        }, {});
        const financeSnapshot = {
            totalsByCurrency,
            overdueInvoices: overdueInvoices.slice(0, 4).map(inv => {
                const paid = inv.payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
                const balance = parseFloat(inv.amount.toString()) - paid;
                const daysOverdue = inv.dueDate
                    ? Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                return {
                    id: inv.id,
                    customer: inv.customer.companyName,
                    amount: `${balance.toLocaleString('en-US')} ${inv.currency}`,
                    days: daysOverdue,
                };
            }),
        };
        // Format campaigns
        const formattedCampaigns = campaigns.slice(0, 3).map(c => {
            // Count leads from this campaign
            const campaignLeads = leads.filter(l => l.campaignId === c.id);
            const leadsGenerated = campaignLeads.length;
            const leadsWon = campaignLeads.filter(l => l.status === 'WON').length;
            const conversionRate = leadsGenerated > 0 ? (leadsWon / leadsGenerated) * 100 : 0;
            // Calculate spend from expenses
            const campaignExpenses = expenses.filter(e => e.campaignId === c.id);
            const totalSpent = campaignExpenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
            return {
                id: c.id,
                name: c.name,
                budget: c.budget ? `$${parseFloat(c.budget.toString()).toLocaleString('en-US')}` : 'N/A',
                spend: `$${totalSpent.toLocaleString('en-US')}`,
                leads: leadsGenerated,
                rate: `${conversionRate.toFixed(0)}%`,
            };
        });
        // Leads chart data (last 6 months)
        const leadsChartData = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const monthName = monthDate.toLocaleString('en-US', { month: 'short' });
            const monthLeads = await prisma.lead.findMany({
                where: {
                    createdAt: {
                        gte: monthDate,
                        lt: nextMonth,
                    },
                },
            });
            const newCount = monthLeads.filter(l => l.status === 'NEW').length;
            const contactedCount = monthLeads.filter(l => l.status === 'CONTACTED').length;
            const wonCount = monthLeads.filter(l => l.status === 'WON').length;
            leadsChartData.push({
                month: monthName,
                new: newCount,
                contacted: contactedCount,
                won: wonCount,
            });
        }
        return {
            stats,
            projects: formattedProjects,
            milestones: formattedMilestones,
            leads: formattedLeads,
            financeSnapshot,
            campaigns: formattedCampaigns,
            leadsChart: leadsChartData,
        };
    },
};
//# sourceMappingURL=dashboard.service.js.map