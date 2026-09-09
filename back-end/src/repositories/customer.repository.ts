import { Prisma, type Customer } from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.js";

// This mirrors the exact prisma.customer.findUnique include query requested in your DTO comments
const withDetails = {
    owner: true,
    originLead: {
        select: { name: true, email: true, phone: true }
    },
    contacts: { 
        orderBy: { createdAt: 'asc' as const }, 
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
} satisfies Prisma.CustomerInclude;

// Cleanly generate the return type combining Customer and its deep relations
export type PrismaCustomerWithDetail = Prisma.CustomerGetPayload<{ include: typeof withDetails }>;

export const customerRepository = {
    findById: (id: number): Promise<Customer | null> => {
        return prisma.customer.findUnique({ where: { id } });
    },

    findByIdWithDetails: (id: number): Promise<PrismaCustomerWithDetail | null> => {
        return prisma.customer.findUnique({ where: { id }, include: withDetails });
    },

    findMany: (
        where: Prisma.CustomerWhereInput,
        skip: number,
        take: number
    ): Promise<PrismaCustomerWithDetail[]> => {
        return prisma.customer.findMany({
            where,
            skip,
            take,
            include: withDetails, // Crucial: Includes financial and project stats automatically
            orderBy: { createdAt: 'desc' }
        });
    },

    count: (where: Prisma.CustomerWhereInput): Promise<number> => {
        return prisma.customer.count({ where });
    },

    create: (data: Prisma.CustomerCreateInput): Promise<PrismaCustomerWithDetail> => {
        return prisma.customer.create({ data, include: withDetails });
    },

    update: (id: number, data: Prisma.CustomerUpdateInput): Promise<PrismaCustomerWithDetail> => {
        return prisma.customer.update({ where: { id }, data, include: withDetails });
    },

    delete: (id: number): Promise<Customer> => {
        return prisma.customer.delete({ where: { id } });
    },

    // --- Contacts ---
    createContact: (customerId: number, data: { name: string; role?: string; email?: string; phone?: string }) => {
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

    findContactById: (id: number) => {
        return prisma.contact.findUnique({ where: { id } });
    },

    updateContact: (id: number, data: { name?: string; role?: string; email?: string; phone?: string }) => {
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

    deleteContact: (id: number) => {
        return prisma.contact.delete({ where: { id } });
    }
};
