import { z } from 'zod';
import { type Campaign, CampaignStatus } from '../generated/prisma/index.js';
export declare const createCampaignSchema: z.ZodObject<{
    name: z.ZodString;
    channel: z.ZodOptional<z.ZodString>;
    budget: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    startDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    endDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export type CreateCampaignDto = z.infer<typeof createCampaignSchema>;
export declare const updateCampaignSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    channel: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        DRAFT: 'DRAFT';
        PLANNED: 'PLANNED';
        ACTIVE: 'ACTIVE';
        PAUSED: 'PAUSED';
        COMPLETED: 'COMPLETED';
    }>>;
    budget: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    startDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    endDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export type UpdateCampaignDto = z.infer<typeof updateCampaignSchema>;
export declare const listCampaignsQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        DRAFT: 'DRAFT';
        PLANNED: 'PLANNED';
        ACTIVE: 'ACTIVE';
        PAUSED: 'PAUSED';
        COMPLETED: 'COMPLETED';
    }>>;
}, z.core.$strip>;
export type ListCampaignsQueryDto = z.infer<typeof listCampaignsQuerySchema>;
export interface CampaignSummaryDto {
    id: number;
    name: string;
    status: CampaignStatus;
}
export declare const toCampaignSummaryDto: (campaign: Campaign) => CampaignSummaryDto;
export type CampaignWithStats = Campaign & {
    _count: {
        leads: number;
    };
    leads: {
        status: string;
    }[];
    expenses: {
        amount: {
            toString(): string;
        };
    }[];
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
        conversionRate: number;
        totalSpent: string;
        budgetRemaining: string | null;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const toCampaignResponseDto: (campaign: CampaignWithStats) => CampaignResponseDto;
//# sourceMappingURL=marketing.dto.d.ts.map