import { z } from 'zod';
import type { Contract, User, Customer, ContractStatus } from '../generated/prisma/index.js';
import { type UserSummaryDto } from './user.dto.js';
import { type CustomerSummaryDto } from './customer.dto.js';
export declare const createContractSchema: z.ZodObject<{
    customerId: z.ZodNumber;
    invoiceDate: z.ZodOptional<z.ZodString>;
    invoiceNumber: z.ZodOptional<z.ZodString>;
    orderId: z.ZodOptional<z.ZodString>;
    activationLimit: z.ZodOptional<z.ZodString>;
    activationProcess: z.ZodOptional<z.ZodString>;
    paymentTerms: z.ZodOptional<z.ZodString>;
    projectDescription: z.ZodString;
    projectDescLine: z.ZodOptional<z.ZodString>;
    lineItemCost: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    taxPercent: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    termsAndConditions: z.ZodString;
    signedByName: z.ZodOptional<z.ZodString>;
    signedAt: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        CANCELLED: "CANCELLED";
        DRAFT: "DRAFT";
        SENT: "SENT";
        SIGNED: "SIGNED";
    }>>;
}, z.core.$strip>;
export type CreateContractDto = z.infer<typeof createContractSchema>;
export declare const updateContractSchema: z.ZodObject<{
    invoiceDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    invoiceNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    orderId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    activationLimit: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    activationProcess: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    paymentTerms: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    projectDescription: z.ZodOptional<z.ZodString>;
    projectDescLine: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    lineItemCost: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    taxPercent: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    termsAndConditions: z.ZodOptional<z.ZodString>;
    signedByName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    signedAt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        CANCELLED: "CANCELLED";
        DRAFT: "DRAFT";
        SENT: "SENT";
        SIGNED: "SIGNED";
    }>>>;
}, z.core.$strip>;
export type UpdateContractDto = z.infer<typeof updateContractSchema>;
export declare const listContractsQuerySchema: z.ZodObject<{
    customerId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    status: z.ZodOptional<z.ZodEnum<{
        CANCELLED: "CANCELLED";
        DRAFT: "DRAFT";
        SENT: "SENT";
        SIGNED: "SIGNED";
    }>>;
}, z.core.$strip>;
export type ListContractsQueryDto = z.infer<typeof listContractsQuerySchema>;
export interface ContractResponseDto {
    id: number;
    customer: CustomerSummaryDto;
    createdBy: UserSummaryDto;
    invoiceDate: string | null;
    invoiceNumber: string | null;
    orderId: string | null;
    activationLimit: string | null;
    activationProcess: string | null;
    paymentTerms: string | null;
    projectDescription: string;
    projectDescLine: string | null;
    lineItemCost: string;
    taxPercent: string;
    totalAmount: string;
    grossTotal: string;
    termsAndConditions: string;
    signedByName: string | null;
    signedAt: string | null;
    status: ContractStatus;
    createdAt: string;
    updatedAt: string;
}
export type ContractWithRelations = Contract & {
    customer: Customer;
    createdBy: User;
};
export declare const toContractResponseDto: (c: ContractWithRelations) => ContractResponseDto;
//# sourceMappingURL=contract.dto.d.ts.map