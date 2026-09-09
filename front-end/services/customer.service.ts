/**
 * services/customer.service.ts
 *
 * Typed wrappers around every /api/v1/customers endpoint.
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
export type CustomerStatus = "ACTIVE" | "INACTIVE" | "CHURNED" | "PROSPECT"
export type CompanySize    = "MICRO" | "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE"

// ── Shared sub-types ──────────────────────────────────────────────────────────
export interface UserSummary {
  id: number
  name: string
  role: string
}

export interface Contact {
  id: number
  customerId: number
  name: string
  role: string | null
  email: string | null
  phone: string | null
  createdAt: string
}

// ── Response types ────────────────────────────────────────────────────────────
export interface Customer {
  id: number
  companyName: string
  industry: string | null
  size: CompanySize
  address: string | null
  status: CustomerStatus
  owner: UserSummary | null
  primaryContact: Contact | null
  originLeadId: number | null
  originLead: { name: string; email: string | null; phone: string | null } | null
  stats: {
    contactsCount: number
    projectsCount: number
    activeProjectsCount: number
    interactionsCount: number
  }
  financials: {
    totalInvoiced: string
    totalPaid: string
    outstandingBalance: string
  }
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ── Request DTOs ──────────────────────────────────────────────────────────────
export interface CreateCustomerDto {
  companyName: string
  industry?: string
  size: CompanySize
  address?: string
  ownerId?: number
  originLeadId?: number
}

export interface UpdateCustomerDto {
  companyName?: string
  industry?: string
  size?: CompanySize
  address?: string
  status?: CustomerStatus
  ownerId?: number | null
}

export interface CreateContactDto {
  name: string
  role?: string
  email?: string
  phone?: string
}

export interface UpdateContactDto {
  name?: string
  role?: string
  email?: string
  phone?: string
}

export interface ListCustomersQuery {
  status?: CustomerStatus
  ownerId?: number
  page?: number
  limit?: number
}

// ── Service ───────────────────────────────────────────────────────────────────
export const customerService = {
  /** GET /customers */
  getAll: (params?: ListCustomersQuery) =>
    api
      .get<ApiEnvelope<Customer[]>>("/customers", { params })
      .then(unwrapPaginated),

  /** GET /customers/:id */
  getById: (id: number) =>
    api.get<ApiEnvelope<Customer>>(`/customers/${id}`).then(unwrap),

  /** POST /customers */
  create: (dto: CreateCustomerDto) =>
    api.post<ApiEnvelope<Customer>>("/customers", dto).then(unwrap),

  /** PUT /customers/:id */
  update: (id: number, dto: UpdateCustomerDto) =>
    api.put<ApiEnvelope<Customer>>(`/customers/${id}`, dto).then(unwrap),

  /** DELETE /customers/:id */
  delete: (id: number) =>
    api
      .delete<ApiEnvelope<{ success: boolean }>>(`/customers/${id}`)
      .then(unwrap),

  // ── Contacts sub-resource ──────────────────────────────────────────────────

  /** POST /customers/:id/contacts */
  addContact: (customerId: number, dto: CreateContactDto) =>
    api
      .post<ApiEnvelope<Contact>>(`/customers/${customerId}/contacts`, dto)
      .then(unwrap),

  /** PUT /customers/contacts/:contactId */
  updateContact: (contactId: number, dto: UpdateContactDto) =>
    api
      .put<ApiEnvelope<Contact>>(`/customers/contacts/${contactId}`, dto)
      .then(unwrap),

  /** DELETE /customers/contacts/:contactId */
  deleteContact: (contactId: number) =>
    api
      .delete<ApiEnvelope<{ success: boolean }>>(
        `/customers/contacts/${contactId}`,
      )
      .then(unwrap),
}
