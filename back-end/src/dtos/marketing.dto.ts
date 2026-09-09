import { z } from 'zod';
import {type  Campaign, CampaignStatus } from '../generated/prisma/index.js';

// ---------- Requests ----------

export const createCampaignSchema = z.object({
  name: z.string().min(1),
  channel: z.string().optional(),
  budget: z.coerce.number().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export type CreateCampaignDto = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  channel: z.string().optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
  budget: z.coerce.number().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export type UpdateCampaignDto = z.infer<typeof updateCampaignSchema>;

export const listCampaignsQuerySchema = z.object({
  status: z.nativeEnum(CampaignStatus).optional(),
});
export type ListCampaignsQueryDto = z.infer<typeof listCampaignsQuerySchema>;

// ---------- Response ----------

// Minimal shape for embedding (Lead.campaign, Expense.campaign)
export interface CampaignSummaryDto {
  id: number;
  name: string;
  status: CampaignStatus;
}

export const toCampaignSummaryDto = (campaign: Campaign): CampaignSummaryDto => ({
  id: campaign.id,
  name: campaign.name,
  status: campaign.status,
});

// Full detail — fetch with:
// prisma.campaign.findUnique({ where: { id }, include: {
//   _count: { select: { leads: true } },
//   leads: { select: { status: true } },
//   expenses: { select: { amount: true } },
// } })
export type CampaignWithStats = Campaign & {
  _count: { leads: number };
  leads: { status: string }[]; // used only to count WON leads
  expenses: { amount: { toString(): string } }[]; // Decimal[]
};

export interface CampaignResponseDto {
  id: number;
  name: string;
  channel: string | null;
  status: CampaignStatus;
  budget: string | null;
  startDate: Date | null;
  endDate: Date | null;
  performance: {
    leadsGenerated: number;
    leadsWon: number;
    conversionRate: number; // percentage, 0-100, 1 decimal
    totalSpent: string;
    budgetRemaining: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const toCampaignResponseDto = (campaign: CampaignWithStats): CampaignResponseDto => {
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