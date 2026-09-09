/**
 * services/contract.service.ts
 *
 * Typed wrappers around every /api/v1/contracts endpoint.
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

// ── Enums ─────────────────────────────────────────────────────────────────────
export type ContractStatus = "DRAFT" | "SENT" | "SIGNED" | "CANCELLED"

// ── Response types ────────────────────────────────────────────────────────────
export interface ContractCustomer {
  id: number
  companyName: string
  status: string
}

export interface ContractCreatedBy {
  id: number
  name: string
  role: string
}

export interface Contract {
  id: number
  customer: ContractCustomer
  createdBy: ContractCreatedBy

  invoiceDate: string | null
  invoiceNumber: string | null
  orderId: string | null
  activationLimit: string | null
  activationProcess: string | null
  paymentTerms: string | null

  projectDescription: string
  projectDescLine: string | null
  lineItemCost: string
  taxPercent: string
  totalAmount: string
  grossTotal: string

  termsAndConditions: string

  signedByName: string | null
  signedAt: string | null

  status: ContractStatus
  createdAt: string
  updatedAt: string
}

// ── Request DTOs ──────────────────────────────────────────────────────────────
export interface CreateContractDto {
  customerId: number

  invoiceDate?: string
  invoiceNumber?: string
  orderId?: string
  activationLimit?: string
  activationProcess?: string
  paymentTerms?: string

  projectDescription: string
  projectDescLine?: string
  lineItemCost?: number
  taxPercent?: number

  termsAndConditions: string

  signedByName?: string
  signedAt?: string

  status?: ContractStatus
}

export type UpdateContractDto = Omit<Partial<CreateContractDto>, "customerId">

export interface ListContractsQuery {
  customerId?: number
  status?: ContractStatus
  page?: number
  limit?: number
}

// ── Service ───────────────────────────────────────────────────────────────────
export const contractService = {
  /** GET /contracts */
  getAll: (params?: ListContractsQuery) =>
    api
      .get<ApiEnvelope<Contract[]>>("/contracts", { params })
      .then(unwrapPaginated),

  /** GET /contracts/:id */
  getById: (id: number) =>
    api.get<ApiEnvelope<Contract>>(`/contracts/${id}`).then(unwrap),

  /** POST /contracts */
  create: (dto: CreateContractDto) =>
    api.post<ApiEnvelope<Contract>>("/contracts", dto).then(unwrap),

  /** PUT /contracts/:id */
  update: (id: number, dto: UpdateContractDto) =>
    api.put<ApiEnvelope<Contract>>(`/contracts/${id}`, dto).then(unwrap),

  /** DELETE /contracts/:id */
  delete: (id: number) =>
    api
      .delete<ApiEnvelope<{ success: boolean }>>(`/contracts/${id}`)
      .then(unwrap),
}
