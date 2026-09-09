import { z } from 'zod';
import { LeadStatus, CompanySize, } from '../generated/prisma/index.js';
import { toUserSummaryDto } from './user.dto.js';
// ---------- Requests ----------
export const createLeadSchema = z.object({
    name: z.string().min(1),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    companyName: z.string().min(1),
    companySize: z.nativeEnum(CompanySize),
    message: z.string().min(1),
}).refine((d) => !!(d.email?.trim() || d.phone?.trim()), { message: "At least one of email or phone is required.", path: ["email"] });
export const updateLeadSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    companyName: z.string().min(1).optional(),
    companySize: z.nativeEnum(CompanySize).optional(),
}).refine((d) => {
    // Only enforce if both are being explicitly set to empty
    const clearingEmail = d.email !== undefined && !d.email?.trim();
    const clearingPhone = d.phone !== undefined && !d.phone?.trim();
    if (clearingEmail && clearingPhone)
        return false;
    return true;
}, { message: "At least one of email or phone is required.", path: ["email"] });
export const changeLeadStatusSchema = z.object({
    newStatus: z.nativeEnum(LeadStatus),
});
export const createLeadNoteSchema = z.object({
    content: z.string().min(1),
});
export const listLeadsQuerySchema = z.object({
    status: z.nativeEnum(LeadStatus).optional(),
    includeConverted: z.coerce.boolean().optional().default(false),
});
export const toLeadNoteResponseDto = (note) => ({
    id: note.id,
    content: note.content,
    author: toUserSummaryDto(note.author),
    createdAt: note.createdAt,
});
export const toLeadStatusHistoryResponseDto = (history) => ({
    id: history.id,
    oldStatus: history.oldStatus,
    newStatus: history.newStatus,
    changedBy: toUserSummaryDto(history.changedBy),
    changedAt: history.changedAt,
});
export const toLeadResponseDto = (lead) => {
    const daysOpen = Math.floor((Date.now() - lead.createdAt.getTime()) / 86_400_000);
    const latestNote = lead.notes[0] ? toLeadNoteResponseDto(lead.notes[0]) : null;
    return {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        companyName: lead.companyName,
        companySize: lead.companySize,
        message: lead.message,
        status: lead.status,
        conversion: {
            isConverted: !!lead.convertedTo,
            convertedCustomerId: lead.convertedTo?.id ?? null,
        },
        engagement: {
            notesCount: lead._count.notes,
            statusChangesCount: lead._count.statusHistory,
            latestNote,
            daysOpen,
        },
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
    };
};
//# sourceMappingURL=lead.dto.js.map