import { z } from 'zod';
import { type Customer, type Contact, type Interaction, CompanySize, CustomerStatus, InteractionType, ProjectStage, type User } from '../generated/prisma/index.js';
import { type UserSummaryDto } from './user.dto.js';
export declare const createCustomerSchema: z.ZodObject<{
    companyName: z.ZodString;
    industry: z.ZodOptional<z.ZodString>;
    size: z.ZodEnum<{
        MICRO: 'MICRO';
        SMALL: 'SMALL';
        MEDIUM: 'MEDIUM';
        LARGE: 'LARGE';
        ENTERPRISE: 'ENTERPRISE';
    }>;
    address: z.ZodOptional<z.ZodString>;
    ownerId: z.ZodOptional<z.ZodNumber>;
    originLeadId: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export declare const updateCustomerSchema: z.ZodObject<{
    companyName: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodEnum<{
        MICRO: 'MICRO';
        SMALL: 'SMALL';
        MEDIUM: 'MEDIUM';
        LARGE: 'LARGE';
        ENTERPRISE: 'ENTERPRISE';
    }>>;
    address: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: 'ACTIVE';
        INACTIVE: 'INACTIVE';
        CHURNED: 'CHURNED';
        PROSPECT: 'PROSPECT';
    }>>;
    ownerId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, z.core.$strip>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
export declare const listCustomersQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: 'ACTIVE';
        INACTIVE: 'INACTIVE';
        CHURNED: 'CHURNED';
        PROSPECT: 'PROSPECT';
    }>>;
    ownerId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type ListCustomersQueryDto = z.infer<typeof listCustomersQuerySchema>;
export declare const createContactSchema: z.ZodObject<{
    name: z.ZodString;
    role: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateContactDto = z.infer<typeof createContactSchema>;
export declare const updateContactSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type UpdateContactDto = z.infer<typeof updateContactSchema>;
export declare const createInteractionSchema: z.ZodObject<{
    type: z.ZodEnum<{
        CALL: 'CALL';
        MEETING: 'MEETING';
        EMAIL: 'EMAIL';
        NOTE: 'NOTE';
    }>;
    content: z.ZodString;
}, z.core.$strip>;
export type CreateInteractionDto = z.infer<typeof createInteractionSchema>;
export interface CustomerSummaryDto {
    id: number;
    companyName: string;
    status: CustomerStatus;
}
export declare const toCustomerSummaryDto: (customer: Customer) => CustomerSummaryDto;
export interface ContactResponseDto {
    id: number;
    customerId: number;
    name: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    createdAt: Date;
}
export declare const toContactResponseDto: (contact: Contact) => ContactResponseDto;
export interface InteractionResponseDto {
    id: number;
    customerId: number;
    type: InteractionType;
    content: string;
    author: UserSummaryDto;
    createdAt: Date;
}
export declare const toInteractionResponseDto: (interaction: Interaction & {
    author: User;
}) => InteractionResponseDto;
export type CustomerWithDetail = Customer & {
    owner?: User | null;
    originLead?: {
        name: string;
        email: string | null;
        phone: string | null;
    } | null;
    contacts: Contact[];
    projects: {
        stage: ProjectStage;
    }[];
    invoices: {
        amount: {
            toString(): string;
        };
        status: string;
        payments: {
            amount: {
                toString(): string;
            };
        }[];
    }[];
    _count: {
        contacts: number;
        projects: number;
        interactions: number;
    };
};
export interface CustomerResponseDto {
    id: number;
    companyName: string;
    industry: string | null;
    size: CompanySize;
    address: string | null;
    status: CustomerStatus;
    owner: UserSummaryDto | null;
    primaryContact: ContactResponseDto | null;
    originLeadId: number | null;
    originLead: {
        name: string;
        email: string | null;
        phone: string | null;
    } | null;
    stats: {
        contactsCount: number;
        projectsCount: number;
        activeProjectsCount: number;
        interactionsCount: number;
    };
    financials: {
        totalInvoiced: string;
        totalPaid: string;
        outstandingBalance: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const toCustomerResponseDto: (customer: CustomerWithDetail) => CustomerResponseDto;
//# sourceMappingURL=customer.dto.d.ts.map