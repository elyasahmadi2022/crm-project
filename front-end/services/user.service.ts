/**
 * services/user.service.ts
 *
 * Typed wrappers around every /api/v1/users endpoint.
 * Backend envelope: { status: number, data: T }
 * Admin-only — all endpoints require ADMIN role.
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

// Unwrap a plain single-item response
function unwrap<T>(r: { data: ApiEnvelope<T> }): T {
  return r.data.data
}

// Unwrap a paginated response — data is the array, pagination is top-level
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
export type UserRole = "ADMIN" | "SALES" | "FINANCE" | "DEVELOPER" | "DESIGNER"

// ── Response types ────────────────────────────────────────────────────────────
export interface UserWorkload {
  ownedLeadsCount: number
  ownedCustomersCount: number
  assignedProjectsCount: number
  interactionsCount: number
}

export interface UserDto {
  id: number
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
  workload: UserWorkload
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
export interface CreateUserDto {
  name: string
  email: string
  role: UserRole
}

export interface UpdateUserDto {
  name?: string
  email?: string
  role?: UserRole
  isActive?: boolean
}

export interface ListUsersQuery {
  role?: UserRole
  isActive?: boolean
  page?: number
  limit?: number
}

// ── Service ───────────────────────────────────────────────────────────────────
export const userService = {
  /** GET /users */
  getAll: (params?: ListUsersQuery) =>
    api
      .get<ApiEnvelope<UserDto[]>>("/users", { params })
      .then(unwrapPaginated),

  /** GET /users/:id */
  getById: (id: number) =>
    api.get<ApiEnvelope<UserDto>>(`/users/${id}`).then(unwrap),

  /** POST /users — creates with a default temporary password */
  create: (dto: CreateUserDto) =>
    api.post<ApiEnvelope<UserDto>>("/users", dto).then(unwrap),

  /** PUT /users/:id */
  update: (id: number, dto: UpdateUserDto) =>
    api.put<ApiEnvelope<UserDto>>(`/users/${id}`, dto).then(unwrap),

  /** DELETE /users/:id */
  delete: (id: number) =>
    api
      .delete<ApiEnvelope<{ success: boolean }>>(`/users/${id}`)
      .then(unwrap),
}
