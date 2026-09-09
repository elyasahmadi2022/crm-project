import { z } from 'zod';
import {
  type Lead, type LeadNote, type LeadStatusHistory,
  LeadStatus, CompanySize, type User, type Customer,
} from '../generated/prisma/index.js';
import { toUserSummaryDto, type UserSummaryDto } from './user.dto.js';

// ---------- Requests ----------

export const createLeadSchema = z.object({
  name:        z.string().min(1),
  email:       z.string().email().optional().or(z.literal("")),
  phone:       z.string().optional(),
  companyName: z.string().min(1),
  companySize: z.nativeEnum(CompanySize),
  message:     z.string().min(1),
}).refine(
  (d) => !!(d.email?.trim() || d.phone?.trim()),
  { message: "At least one of email or phone is required.", path: ["email"] }
);
export type CreateLeadDto = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = z.object({
  name:        z.string().min(1).optional(),
  email:       z.string().email().optional().or(z.literal("")),
  phone:       z.string().optional(),
  companyName: z.string().min(1).optional(),
  companySize: z.nativeEnum(CompanySize).optional(),
}).refine(
  (d) => {
    // Only enforce if both are being explicitly set to empty
    const clearingEmail = d.email !== undefined && !d.email?.trim()
    const clearingPhone = d.phone !== undefined && !d.phone?.trim()
    if (clearingEmail && clearingPhone) return false
    return true
  },
  { message: "At least one of email or phone is required.", path: ["email"] }
);
export type UpdateLeadDto = z.infer<typeof updateLeadSchema>;

export const changeLeadStatusSchema = z.object({
  newStatus: z.nativeEnum(LeadStatus),
});
export type ChangeLeadStatusDto = z.infer<typeof changeLeadStatusSchema>;

export const createLeadNoteSchema = z.object({
  content: z.string().min(1),
});
export type CreateLeadNoteDto = z.infer<typeof createLeadNoteSchema>;

export const listLeadsQuerySchema = z.object({
  status:           z.nativeEnum(LeadStatus).optional(),
  includeConverted: z.coerce.boolean().optional().default(false),
});
export type ListLeadsQueryDto = z.infer<typeof listLeadsQuerySchema>;

// ---------- Response ----------

export interface LeadNoteResponseDto {
  id: number;
  content: string;
  author: UserSummaryDto;
  createdAt: Date;
}

export const toLeadNoteResponseDto = (
  note: LeadNote & { author: User },
): LeadNoteResponseDto => ({
  id:        note.id,
  content:   note.content,
  author:    toUserSummaryDto(note.author),
  createdAt: note.createdAt,
});

export interface LeadStatusHistoryResponseDto {
  id:         number;
  oldStatus:  LeadStatus | null;
  newStatus:  LeadStatus;
  changedBy:  UserSummaryDto;
  changedAt:  Date;
}

export const toLeadStatusHistoryResponseDto = (
  history: LeadStatusHistory & { changedBy: User },
): LeadStatusHistoryResponseDto => ({
  id:        history.id,
  oldStatus: history.oldStatus,
  newStatus: history.newStatus,
  changedBy: toUserSummaryDto(history.changedBy),
  changedAt: history.changedAt,
});

export type LeadWithDetail = Lead & {
  convertedTo?: Pick<Customer, 'id'> | null;
  notes: (LeadNote & { author: User })[];
  _count: { notes: number; statusHistory: number };
};

export interface LeadResponseDto {
  id:          number;
  name:        string;
  email:       string | null;
  phone:       string | null;
  companyName: string;
  companySize: CompanySize;
  message:     string;
  status:      LeadStatus;
  conversion: {
    isConverted:         boolean;
    convertedCustomerId: number | null;
  };
  engagement: {
    notesCount:         number;
    statusChangesCount: number;
    latestNote:         LeadNoteResponseDto | null;
    daysOpen:           number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const toLeadResponseDto = (lead: LeadWithDetail): LeadResponseDto => {
  const daysOpen   = Math.floor((Date.now() - lead.createdAt.getTime()) / 86_400_000);
  const latestNote = lead.notes[0] ? toLeadNoteResponseDto(lead.notes[0]) : null;

  return {
    id:          lead.id,
    name:        lead.name,
    email:       lead.email,
    phone:       lead.phone,
    companyName: lead.companyName,
    companySize: lead.companySize,
    message:     lead.message,
    status:      lead.status,
    conversion: {
      isConverted:         !!lead.convertedTo,
      convertedCustomerId: lead.convertedTo?.id ?? null,
    },
    engagement: {
      notesCount:         lead._count.notes,
      statusChangesCount: lead._count.statusHistory,
      latestNote,
      daysOpen,
    },
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
};
