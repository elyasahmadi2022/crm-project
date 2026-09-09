import { Prisma, type Campaign } from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.js";

// This implements the exact nested include structure from your DTO notes
const withStats = {
    _count: { 
        select: { leads: true } 
    },
    leads: { 
        select: { status: true } 
    },
    expenses: { 
        select: { amount: true } 
    }
} satisfies Prisma.CampaignInclude;

export type PrismaCampaignWithStats = Prisma.CampaignGetPayload<{ include: typeof withStats }>;

export const marketingRepository = {
    findById: (id: number): Promise<Campaign | null> => {
        return prisma.campaign.findUnique({ where: { id } });
    },

    findByIdWithStats: (id: number): Promise<PrismaCampaignWithStats | null> => {
        return prisma.campaign.findUnique({ where: { id }, include: withStats });
    },

    findMany: (
        where: Prisma.CampaignWhereInput,
        skip: number,
        take: number
    ): Promise<PrismaCampaignWithStats[]> => {
        return prisma.campaign.findMany({
            where,
            skip,
            take,
            include: withStats,
            orderBy: { createdAt: 'desc' }
        });
    },

    count: (where: Prisma.CampaignWhereInput): Promise<number> => {
        return prisma.campaign.count({ where });
    },

    create: (data: Prisma.CampaignCreateInput): Promise<PrismaCampaignWithStats> => {
        return prisma.campaign.create({ data, include: withStats });
    },

    update: (id: number, data: Prisma.CampaignUpdateInput): Promise<PrismaCampaignWithStats> => {
        return prisma.campaign.update({ where: { id }, data, include: withStats });
    },

    delete: (id: number): Promise<Campaign> => {
        return prisma.campaign.delete({ where: { id } });
    }
};
