import { z } from 'zod';
import { type Lead, type LeadNote, type LeadStatusHistory, LeadStatus, CompanySize, type User, type Customer } from '../generated/prisma/index.js';
import { type UserSummaryDto } from './user.dto.js';
export declare const createLeadSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    companyName: z.ZodString;
    companySize: z.ZodEnum<{
        MICRO: 'MICRO';
        SMALL: 'SMALL';
        MEDIUM: 'MEDIUM';
        LARGE: 'LARGE';
        ENTERPRISE: 'ENTERPRISE';
    }>;
    message: z.ZodString;
}, z.core.$strip>;
export type CreateLeadDto = z.infer<typeof createLeadSchema>;
export declare const updateLeadSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    companyName: z.ZodOptional<z.ZodString>;
    companySize: z.ZodOptional<z.ZodEnum<{
        MICRO: 'MICRO';
        SMALL: 'SMALL';
        MEDIUM: 'MEDIUM';
        LARGE: 'LARGE';
        ENTERPRISE: 'ENTERPRISE';
    }>>;
}, z.core.$strip>;
export type UpdateLeadDto = z.infer<typeof updateLeadSchema>;
export declare const changeLeadStatusSchema: z.ZodObject<{
    newStatus: z.ZodEnum<{
        NEW: 'NEW';
        CONTACTED: 'CONTACTED';
        PENDING: 'PENDING';
        ON_HOLD: 'ON_HOLD';
        WON: 'WON';
        LOST: 'LOST';
    }>;
}, z.core.$strip>;
export type ChangeLeadStatusDto = z.infer<typeof changeLeadStatusSchema>;
export declare const createLeadNoteSchema: z.ZodObject<{
    content: z.ZodString;
}, z.core.$strip>;
export type CreateLeadNoteDto = z.infer<typeof createLeadNoteSchema>;
export declare const listLeadsQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        NEW: 'NEW';
        CONTACTED: 'CONTACTED';
        PENDING: 'PENDING';
        ON_HOLD: 'ON_HOLD';
        WON: 'WON';
        LOST: 'LOST';
    }>>;
    includeConverted: z.ZodDefault<z.ZodOptional<z.ZodCoercedBoolean<unknown>>>;
}, z.core.$strip>;
export type ListLeadsQueryDto = z.infer<typeof listLeadsQuerySchema>;
export interface LeadNoteResponseDto {
    id: number;
    content: string;
    author: UserSummaryDto;
    createdAt: Date;
}
export declare const toLeadNoteResponseDto: (note: LeadNote & {
    author: User;
}) => LeadNoteResponseDto;
export interface LeadStatusHistoryResponseDto {
    id: number;
    oldStatus: LeadStatus | null;
    newStatus: LeadStatus;
    changedBy: UserSummaryDto;
    changedAt: Date;
}
export declare const toLeadStatusHistoryResponseDto: (history: LeadStatusHistory & {
    changedBy: User;
}) => LeadStatusHistoryResponseDto;
export type LeadWithDetail = Lead & {
    convertedTo?: Pick<Customer, 'id'> | null;
    notes: (LeadNote & {
        author: User;
    })[];
    _count: {
        notes: number;
        statusHistory: number;
    };
};
export interface LeadResponseDto {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    companyName: string;
    companySize: CompanySize;
    message: string;
    status: LeadStatus;
    conversion: {
        isConverted: boolean;
        convertedCustomerId: number | null;
    };
    engagement: {
        notesCount: number;
        statusChangesCount: number;
        latestNote: LeadNoteResponseDto | null;
        daysOpen: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const toLeadResponseDto: (lead: LeadWithDetail) => LeadResponseDto;
//# sourceMappingURL=lead.dto.d.ts.map