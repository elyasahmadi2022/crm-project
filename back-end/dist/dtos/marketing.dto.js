import { z } from 'zod';
import { CampaignStatus } from '../generated/prisma/index.js';
// ---------- Requests ----------
export const createCampaignSchema = z.object({
    name: z.string().min(1),
    channel: z.string().optional(),
    budget: z.coerce.number().positive().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
});
export const updateCampaignSchema = z.object({
    name: z.string().min(1).optional(),
    channel: z.string().optional(),
    status: z.nativeEnum(CampaignStatus).optional(),
    budget: z.coerce.number().positive().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
});
export const listCampaignsQuerySchema = z.object({
    status: z.nativeEnum(CampaignStatus).optional(),
});
export const toCampaignSummaryDto = (campaign) => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
});
export const toCampaignResponseDto = (campaign) => {
    const leadsGenerated = campaign._count.leads;
    const leadsWon = campaign.leads.filter((l) => l.status === 'WON').length;
    const conversionRate = leadsGenerated > 0 ? Math.round((leadsWon / leadsGenerated) * 1000) / 10 : 0;
    const totalSpent = campaign.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const budget = campaign.budget ? Number(campaign.budget) : null;
    return {
        id: campaign.id,
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
        budget: campaign.budget?.toString() ?? null,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        performance: {
            leadsGenerated,
            leadsWon,
            conversionRate,
            totalSpent: totalSpent.toFixed(2),
            budgetRemaining: budget !== null ? (budget - totalSpent).toFixed(2) : null,
        },
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
    };
};
//# sourceMappingURL=marketing.dto.js.map