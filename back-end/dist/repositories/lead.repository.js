import { Prisma } from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.js";
const withDetails = {
    convertedTo: { select: { id: true } },
    notes: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { author: true }
    },
    _count: {
        select: { notes: true, statusHistory: true }
    }
};
export const leadRepository = {
    findById: (id) => {
        return prisma.lead.findUnique({ where: { id } });
    },
    findByIdWithDetails: (id) => {
        return prisma.lead.findUnique({ where: { id }, include: withDetails });
    },
    findMany: (where, skip, take) => {
        return prisma.lead.findMany({
            where,
            skip,
            take,
            include: withDetails,
            orderBy: { createdAt: 'desc' }
        });
    },
    count: (where) => {
        return prisma.lead.count({ where });
    },
    create: (data) => {
        return prisma.lead.create({ data, include: withDetails });
    },
    update: (id, data) => {
        return prisma.lead.update({ where: { id }, data, include: withDetails });
    },
    delete: (id) => {
        return prisma.lead.delete({ where: { id } });
    },
    /**
     * Appends an operational note to a lead thread
     */
    createNote: (leadId, authorId, content) => {
        return prisma.leadNote.create({
            data: { leadId, authorId, content },
            include: { author: true }
        });
    },
    /**
     * Logs workflow history transitions securely
     */
    logStatusChange: (leadId, oldStatus, newStatus, userId) => {
        return prisma.leadStatusHistory.create({
            data: { leadId, oldStatus, newStatus, changedById: userId }
        });
    }
};
//# sourceMappingURL=lead.repository.js.map