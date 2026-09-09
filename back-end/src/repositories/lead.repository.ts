import { Prisma, type Lead, type LeadNote } from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.js";

const withDetails = {
    convertedTo: { select: { id: true } },
    notes: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        include: { author: true }
    },
    _count: {
        select: { notes: true, statusHistory: true }
    }
} satisfies Prisma.LeadInclude;

export type PrismaLeadWithDetail = Prisma.LeadGetPayload<{ include: typeof withDetails }>;

export const leadRepository = {
    findById: (id: number): Promise<Lead | null> => {
        return prisma.lead.findUnique({ where: { id } });
    },

    findByIdWithDetails: (id: number): Promise<PrismaLeadWithDetail | null> => {
        return prisma.lead.findUnique({ where: { id }, include: withDetails });
    },

    findMany: (
        where: Prisma.LeadWhereInput,
        skip: number,
        take: number
    ): Promise<PrismaLeadWithDetail[]> => {
        return prisma.lead.findMany({
            where,
            skip,
            take,
            include: withDetails,
            orderBy: { createdAt: 'desc' }
        });
    },

    count: (where: Prisma.LeadWhereInput): Promise<number> => {
        return prisma.lead.count({ where });
    },

    create: (data: Prisma.LeadCreateInput): Promise<PrismaLeadWithDetail> => {
        return prisma.lead.create({ data, include: withDetails });
    },

    update: (id: number, data: Prisma.LeadUpdateInput): Promise<PrismaLeadWithDetail> => {
        return prisma.lead.update({ where: { id }, data, include: withDetails });
    },

    delete: (id: number): Promise<Lead> => {
        return prisma.lead.delete({ where: { id } });
    },

    /**
     * Appends an operational note to a lead thread
     */
    createNote: (leadId: number, authorId: number, content: string) => {
        return prisma.leadNote.create({
            data: { leadId, authorId, content },
            include: { author: true }
        });
    },

    /**
     * Logs workflow history transitions securely
     */
    logStatusChange: (leadId: number, oldStatus: any, newStatus: any, userId: number) => {
        return prisma.leadStatusHistory.create({
            data: { leadId, oldStatus, newStatus, changedById: userId }
        });
    }
};
