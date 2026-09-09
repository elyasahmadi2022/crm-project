import { Prisma } from "../generated/prisma/index.js";
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
};
export const marketingRepository = {
    findById: (id) => {
        return prisma.campaign.findUnique({ where: { id } });
    },
    findByIdWithStats: (id) => {
        return prisma.campaign.findUnique({ where: { id }, include: withStats });
    },
    findMany: (where, skip, take) => {
        return prisma.campaign.findMany({
            where,
            skip,
            take,
            include: withStats,
            orderBy: { createdAt: 'desc' }
        });
    },
    count: (where) => {
        return prisma.campaign.count({ where });
    },
    create: (data) => {
        return prisma.campaign.create({ data, include: withStats });
    },
    update: (id, data) => {
        return prisma.campaign.update({ where: { id }, data, include: withStats });
    },
    delete: (id) => {
        return prisma.campaign.delete({ where: { id } });
    }
};
//# sourceMappingURL=marketing.repository.js.map