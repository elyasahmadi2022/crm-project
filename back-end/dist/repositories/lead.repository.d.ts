import { Prisma, type Lead } from "../generated/prisma/index.js";
declare const withDetails: {
    convertedTo: {
        select: {
            id: true;
        };
    };
    notes: {
        orderBy: {
            createdAt: 'desc';
        };
        take: number;
        include: {
            author: true;
        };
    };
    _count: {
        select: {
            notes: true;
            statusHistory: true;
        };
    };
};
export type PrismaLeadWithDetail = Prisma.LeadGetPayload<{
    include: typeof withDetails;
}>;
export declare const leadRepository: {
    findById: (id: number) => Promise<Lead | null>;
    findByIdWithDetails: (id: number) => Promise<PrismaLeadWithDetail | null>;
    findMany: (where: Prisma.LeadWhereInput, skip: number, take: number) => Promise<PrismaLeadWithDetail[]>;
    count: (where: Prisma.LeadWhereInput) => Promise<number>;
    create: (data: Prisma.LeadCreateInput) => Promise<PrismaLeadWithDetail>;
    update: (id: number, data: Prisma.LeadUpdateInput) => Promise<PrismaLeadWithDetail>;
    delete: (id: number) => Promise<Lead>;
    /**
     * Appends an operational note to a lead thread
     */
    createNote: (leadId: number, authorId: number, content: string) => Prisma.Prisma__LeadNoteClient<{
        author: {
            id: number;
            name: string;
            email: string;
            role: import("../generated/prisma/index.js").$Enums.UserRole;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            password: string;
            avatarUrl: string | null;
            forcePasswordChange: boolean;
            salary: Prisma.Decimal | null;
            position: string | null;
            department: string | null;
            joinDate: Date | null;
            faceEmbedding: string | null;
        };
    } & {
        id: number;
        leadId: number;
        authorId: number;
        content: string;
        createdAt: Date;
    }, never, import("../generated/prisma/runtime/client.js").DefaultArgs, Prisma.PrismaClientOptions>;
    /**
     * Logs workflow history transitions securely
     */
    logStatusChange: (leadId: number, oldStatus: any, newStatus: any, userId: number) => Prisma.Prisma__LeadStatusHistoryClient<{
        id: number;
        leadId: number;
        oldStatus: import("../generated/prisma/index.js").$Enums.LeadStatus | null;
        newStatus: import("../generated/prisma/index.js").$Enums.LeadStatus;
        changedById: number;
        changedAt: Date;
    }, never, import("../generated/prisma/runtime/client.js").DefaultArgs, Prisma.PrismaClientOptions>;
};
export {};
//# sourceMappingURL=lead.repository.d.ts.map