import { Prisma } from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.js";
// This mirrors the exact prisma.customer.findUnique include query requested in your DTO comments
const withDetails = {
    owner: true,
    originLead: {
        select: { name: true, email: true, phone: true }
    },
    contacts: {
        orderBy: { createdAt: 'asc' },
        take: 1
    },
    projects: {
        select: { stage: true }
    },
    invoices: {
        select: {
            amount: true,
            status: true,
            payments: { select: { amount: true } }
        }
    },
    _count: {
        select: {
            contacts: true,
            projects: true,
            interactions: true
        }
    }
};
export const customerRepository = {
    findById: (id) => {
        return prisma.customer.findUnique({ where: { id } });
    },
    findByIdWithDetails: (id) => {
        return prisma.customer.findUnique({ where: { id }, include: withDetails });
    },
    findMany: (where, skip, take) => {
        return prisma.customer.findMany({
            where,
            skip,
            take,
            include: withDetails, // Crucial: Includes financial and project stats automatically
            orderBy: { createdAt: 'desc' }
        });
    },
    count: (where) => {
        return prisma.customer.count({ where });
    },
    create: (data) => {
        return prisma.customer.create({ data, include: withDetails });
    },
    update: (id, data) => {
        return prisma.customer.update({ where: { id }, data, include: withDetails });
    },
    delete: (id) => {
        return prisma.customer.delete({ where: { id } });
    },
    // --- Contacts ---
    createContact: (customerId, data) => {
        return prisma.contact.create({
            data: {
                customerId,
                name: data.name,
                ...(data.role !== undefined ? { role: data.role } : {}),
                ...(data.email !== undefined ? { email: data.email } : {}),
                ...(data.phone !== undefined ? { phone: data.phone } : {})
            }
        });
    },
    findContactById: (id) => {
        return prisma.contact.findUnique({ where: { id } });
    },
    updateContact: (id, data) => {
        return prisma.contact.update({
            where: { id },
            data: {
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(data.role !== undefined ? { role: data.role } : {}),
                ...(data.email !== undefined ? { email: data.email } : {}),
                ...(data.phone !== undefined ? { phone: data.phone } : {})
            }
        });
    },
    deleteContact: (id) => {
        return prisma.contact.delete({ where: { id } });
    }
};
//# sourceMappingURL=customer.repository.js.map