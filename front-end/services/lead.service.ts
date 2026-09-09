/**
 * services/lead.service.ts
 *
 * Typed wrappers around every /api/v1/leads endpoint.
 * Backend envelope: { status: number, data: T }
 */

import { api } from "@/lib/api"

// ── Envelope ──────────────────────────────────────────────────────────────────
interface ApiEnvelope<T> {
  status: number
  data: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function unwrap<T>(r: { data: ApiEnvelope<T> }): T {
  return r.data.data
}

function unwrapPaginated<T>(r: { data: ApiEnvelope<T[]> }): {
  data: T[]
  meta: { page: number; limit: number; total: number; totalPages: number }
} {
  return {
    data: r.data.data,
    meta: r.data.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
  }
}

// ── Enums (mirror backend) ────────────────────────────────────────────────────
export type LeadStatus  = "NEW" | "CONTACTED" | "PENDING" | "ON_HOLD" | "WON" | "LOST"
export type CompanySize = "MICRO" | "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE"

// ── Shared sub-types ──────────────────────────────────────────────────────────
export interface UserSummary {
  id: number
  name: string
  role: string
}

export interface LeadNote {
  id: number
  content: string
  author: UserSummary
  createdAt: string
}

// ── Response types ────────────────────────────────────────────────────────────
export interface Lead {
  id: number
  name: string
  email: string | null
  phone: string | null
  companyName: string
  companySize: CompanySize
  message: string
  status: LeadStatus
  conversion: {
    isConverted: boolean
    convertedCustomerId: number | null
  }
  engagement: {
    notesCount: number
    statusChangesCount: number
    latestNote: LeadNote | null
    daysOpen: number
  }
  createdAt: string
  updatedAt: string
}

// ── Request DTOs ──────────────────────────────────────────────────────────────
export interface CreateLeadDto {
  name: string
  email?: string
  phone?: string
  companyName: string
  companySize: CompanySize
  message: string
}

export interface UpdateLeadDto {
  name?: string
  email?: string
  phone?: string
  companyName?: string
  companySize?: CompanySize
}

export interface ChangeLeadStatusDto {
  newStatus: LeadStatus
}

export interface AddLeadNoteDto {
  content: string
}

export interface ListLeadsQuery {
  status?: LeadStatus
  includeConverted?: boolean
  page?: number
  limit?: number
}

// ── Service ───────────────────────────────────────────────────────────────────
export const leadService = {
  /** GET /leads */
  getAll: (params?: ListLeadsQuery) =>
    api
      .get<ApiEnvelope<Lead[]>>("/leads", { params })
      .then(unwrapPaginated),

  /** GET /leads/:id */
  getById: (id: number) =>
    api.get<ApiEnvelope<Lead>>(`/leads/${id}`).then(unwrap),

  /** POST /leads */
  create: (dto: CreateLeadDto) =>
    api.post<ApiEnvelope<Lead>>("/leads", dto).then(unwrap),

  /** PUT /leads/:id */
  update: (id: number, dto: UpdateLeadDto) =>
    api.put<ApiEnvelope<Lead>>(`/leads/${id}`, dto).then(unwrap),

  /** PATCH /leads/:id/status */
  changeStatus: (id: number, dto: ChangeLeadStatusDto) =>
    api.patch<ApiEnvelope<Lead>>(`/leads/${id}/status`, dto).then(unwrap),

  /** POST /leads/:id/notes */
  addNote: (id: number, dto: AddLeadNoteDto) =>
    api.post<ApiEnvelope<Lead>>(`/leads/${id}/notes`, dto).then(unwrap),

  /** POST /leads/:id/convert */
  convertToCustomer: (id: number) =>
    api.post<ApiEnvelope<Lead>>(`/leads/${id}/convert`).then(unwrap),

  /** DELETE /leads/:id */
  delete: (id: number) =>
    api.delete<ApiEnvelope<{ success: boolean }>>(`/leads/${id}`).then(unwrap),
}
