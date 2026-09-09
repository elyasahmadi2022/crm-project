/**
 * services/expense-category.service.ts
 * Route prefix: /api/v1/expense-categories
 *
 * Manages user-created expense categories stored in the DB.
 * These are separate from the built-in enum values (SOFTWARE, HARDWARE…).
 */
import { api } from "@/lib/api"

interface ApiEnvelope<T> { status: number; data: T }
function unwrap<T>(r: { data: ApiEnvelope<T> }): T { return r.data.data }

export interface CustomCategoryDto {
  id:           number
  name:         string
  color:        string
  description:  string | null
  expenseCount: number
  createdAt:    string
  updatedAt:    string
}

export interface CreateCustomCategoryDto {
  name:         string
  color:        string
  description?: string
}

export type UpdateCustomCategoryDto = Partial<CreateCustomCategoryDto>

export const expenseCategoryService = {
  getAll: () =>
    api.get<ApiEnvelope<CustomCategoryDto[]>>("/expense-categories").then(unwrap),

  getById: (id: number) =>
    api.get<ApiEnvelope<CustomCategoryDto>>(`/expense-categories/${id}`).then(unwrap),

  create: (dto: CreateCustomCategoryDto) =>
    api.post<ApiEnvelope<CustomCategoryDto>>("/expense-categories", dto).then(unwrap),

  update: (id: number, dto: UpdateCustomCategoryDto) =>
    api.patch<ApiEnvelope<CustomCategoryDto>>(`/expense-categories/${id}`, dto).then(unwrap),

  delete: (id: number) =>
    api.delete<ApiEnvelope<{ success: boolean }>>(`/expense-categories/${id}`).then(unwrap),
}
