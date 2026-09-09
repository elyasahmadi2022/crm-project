import { Prisma, type Campaign } from "../generated/prisma/index.js";
declare const withStats: {
    _count: {
        select: {
            leads: true;
        };
    };
    leads: {
        select: {
            status: true;
        };
    };
    expenses: {
        select: {
            amount: true;
        };
    };
};
export type PrismaCampaignWithStats = Prisma.CampaignGetPayload<{
    include: typeof withStats;
}>;
export declare const marketingRepository: {
    findById: (id: number) => Promise<Campaign | null>;
    findByIdWithStats: (id: number) => Promise<PrismaCampaignWithStats | null>;
    findMany: (where: Prisma.CampaignWhereInput, skip: number, take: number) => Promise<PrismaCampaignWithStats[]>;
    count: (where: Prisma.CampaignWhereInput) => Promise<number>;
    create: (data: Prisma.CampaignCreateInput) => Promise<PrismaCampaignWithStats>;
    update: (id: number, data: Prisma.CampaignUpdateInput) => Promise<PrismaCampaignWithStats>;
    delete: (id: number) => Promise<Campaign>;
};
export {};
//# sourceMappingURL=marketing.repository.d.ts.map