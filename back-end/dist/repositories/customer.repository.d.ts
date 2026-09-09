import { Prisma, type Customer } from "../generated/prisma/index.js";
declare const withDetails: {
    owner: true;
    originLead: {
        select: {
            name: true;
            email: true;
            phone: true;
        };
    };
    contacts: {
        orderBy: {
            createdAt: 'asc';
        };
        take: number;
    };
    projects: {
        select: {
            stage: true;
        };
    };
    invoices: {
        select: {
            amount: true;
            status: true;
            payments: {
                select: {
                    amount: true;
                };
            };
        };
    };
    _count: {
        select: {
            contacts: true;
            projects: true;
            interactions: true;
        };
    };
};
export type PrismaCustomerWithDetail = Prisma.CustomerGetPayload<{
    include: typeof withDetails;
}>;
export declare const customerRepository: {
    findById: (id: number) => Promise<Customer | null>;
    findByIdWithDetails: (id: number) => Promise<PrismaCustomerWithDetail | null>;
    findMany: (where: Prisma.CustomerWhereInput, skip: number, take: number) => Promise<PrismaCustomerWithDetail[]>;
    count: (where: Prisma.CustomerWhereInput) => Promise<number>;
    create: (data: Prisma.CustomerCreateInput) => Promise<PrismaCustomerWithDetail>;
    update: (id: number, data: Prisma.CustomerUpdateInput) => Promise<PrismaCustomerWithDetail>;
    delete: (id: number) => Promise<Customer>;
    createContact: (customerId: number, data: {
        name: string;
        role?: string;
        email?: string;
        phone?: string;
    }) => Prisma.Prisma__ContactClient<{
        id: number;
        customerId: number;
        name: string;
        role: string | null;
        email: string | null;
        phone: string | null;
        createdAt: Date;
    }, never, import("../generated/prisma/runtime/client.js").DefaultArgs, Prisma.PrismaClientOptions>;
    findContactById: (id: number) => Prisma.Prisma__ContactClient<{
        id: number;
        customerId: number;
        name: string;
        role: string | null;
        email: string | null;
        phone: string | null;
        createdAt: Date;
    } | null, null, import("../generated/prisma/runtime/client.js").DefaultArgs, Prisma.PrismaClientOptions>;
    updateContact: (id: number, data: {
        name?: string;
        role?: string;
        email?: string;
        phone?: string;
    }) => Prisma.Prisma__ContactClient<{
        id: number;
        customerId: number;
        name: string;
        role: string | null;
        email: string | null;
        phone: string | null;
        createdAt: Date;
    }, never, import("../generated/prisma/runtime/client.js").DefaultArgs, Prisma.PrismaClientOptions>;
    deleteContact: (id: number) => Prisma.Prisma__ContactClient<{
        id: number;
        customerId: number;
        name: string;
        role: string | null;
        email: string | null;
        phone: string | null;
        createdAt: Date;
    }, never, import("../generated/prisma/runtime/client.js").DefaultArgs, Prisma.PrismaClientOptions>;
};
export {};
//# sourceMappingURL=customer.repository.d.ts.map