import { Prisma } from '../generated/prisma/index.js';
declare const withRelations: {
    customer: true;
    createdBy: true;
};
export type PrismaContractWithRelations = Prisma.ContractGetPayload<{
    include: typeof withRelations;
}>;
export declare const contractRepository: {
    findById: (id: number) => Promise<PrismaContractWithRelations | null>;
    findMany: (where: Prisma.ContractWhereInput, skip: number, take: number) => Promise<PrismaContractWithRelations[]>;
    count: (where: Prisma.ContractWhereInput) => Promise<number>;
    create: (data: Prisma.ContractCreateInput) => Promise<PrismaContractWithRelations>;
    update: (id: number, data: Prisma.ContractUpdateInput) => Promise<PrismaContractWithRelations>;
    delete: (id: number) => Prisma.Prisma__ContractClient<{
        id: number;
        customerId: number;
        invoiceDate: Date | null;
        invoiceNumber: string | null;
        orderId: string | null;
        activationLimit: string | null;
        activationProcess: string | null;
        paymentTerms: string | null;
        projectDescription: string;
        projectDescLine: string | null;
        lineItemCost: Prisma.Decimal;
        taxPercent: Prisma.Decimal;
        totalAmount: Prisma.Decimal;
        grossTotal: Prisma.Decimal;
        termsAndConditions: string;
        signedByName: string | null;
        signedAt: Date | null;
        status: import("../generated/prisma/index.js").$Enums.ContractStatus;
        createdById: number;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("../generated/prisma/runtime/client.js").DefaultArgs, Prisma.PrismaClientOptions>;
};
export {};
//# sourceMappingURL=contract.repository.d.ts.map