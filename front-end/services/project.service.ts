/**
 * services/project.service.ts
 * Route prefix: /api/v1/projects
 */
import { api } from "@/lib/api"

interface ApiEnvelope<T> {
  status: number
  data: T
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

function unwrap<T>(r: { data: ApiEnvelope<T> }): T {
  return r.data.data
}

function unwrapPaginated<T>(r: { data: ApiEnvelope<T[]> }) {
  return {
    data: r.data.data,
    meta: r.data.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
  }
}

// ── Enums ─────────────────────────────────────────────────────────────────────
export type ProjectStage =
  | "REQUIREMENTS"
  | "DESIGN"
  | "DEVELOPMENT"
  | "TESTING"
  | "DEPLOYMENT"
  | "LIVE"

export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "DONE"

// ── Shared sub-types ──────────────────────────────────────────────────────────
export interface UserSummary { id: number; name: string; role: string }
export interface CustomerSummary { id: number; companyName: string; status: string }

// ── Response types ────────────────────────────────────────────────────────────
export interface ProjectDto {
  id: number
  name: string
  description: string | null
  stage: ProjectStage
  customer: CustomerSummary
  team: UserSummary[]
  milestones: MilestoneDto[]
  assignments: AssignmentDto[]
  progress: {
    milestonesTotal: number
    milestonesDone: number
    percentComplete: number
  }
  timeline: {
    startDate: string | null
    endDate: string | null
    isOverdue: boolean
    daysRemaining: number | null
  }
  financials: { totalInvoiced: string; totalExpenses: string }
  createdAt: string
  updatedAt: string
}

export interface ProjectDetailDto extends ProjectDto {
  // Same as ProjectDto now that milestones and assignments are included
}

export interface MilestoneDto {
  id: number
  projectId: number
  title: string
  dueDate: string | null
  status: MilestoneStatus
  isOverdue: boolean
  createdAt: string
  assignedEmployeeId: number | null
  assignedEmployee: { id: number; name: string; avatarUrl: string | null } | null
}

export interface AssignmentDto {
  id: number
  projectId: number
  employee: UserSummary
  roleOnProject: string | null
  assignedAt: string
}

// ── Request DTOs ──────────────────────────────────────────────────────────────
export interface CreateProjectDto {
  customerId?: number | null
  name: string
  description?: string
  startDate?: string
  endDate?: string
}

export interface UpdateProjectDto {
  name?: string
  description?: string
  startDate?: string
  endDate?: string
}

export interface ChangeStageDto { newStage: ProjectStage }

export interface CreateMilestoneDto { title: string; dueDate?: string; assignedEmployeeId?: number }

export interface UpdateMilestoneDto {
  title?: string
  dueDate?: string
  status?: MilestoneStatus
  assignedEmployeeId?: number | null
}

export interface AssignTeamMemberDto { employeeId: number; roleOnProject?: string }

export interface ListProjectsQuery {
  stage?: ProjectStage
  customerId?: number
  page?: number
  limit?: number
}

// ── Service ───────────────────────────────────────────────────────────────────
export const projectService = {
  getAll: (params?: ListProjectsQuery) =>
    api.get<ApiEnvelope<ProjectDto[]>>("/projects", { params }).then(unwrapPaginated),

  getById: (id: number) =>
    api.get<ApiEnvelope<ProjectDto>>(`/projects/${id}`).then(unwrap),

  create: (dto: CreateProjectDto) =>
    api.post<ApiEnvelope<ProjectDto>>("/projects", dto).then(unwrap),

  update: (id: number, dto: UpdateProjectDto) =>
    api.put<ApiEnvelope<ProjectDto>>(`/projects/${id}`, dto).then(unwrap),

  changeStage: (id: number, dto: ChangeStageDto) =>
    api.patch<ApiEnvelope<ProjectDto>>(`/projects/${id}/stage`, dto).then(unwrap),

  addMilestone: (id: number, dto: CreateMilestoneDto) =>
    api.post<ApiEnvelope<MilestoneDto>>(`/projects/${id}/milestones`, dto).then(unwrap),

  updateMilestone: (milestoneId: number, dto: UpdateMilestoneDto) =>
    api.put<ApiEnvelope<MilestoneDto>>(`/projects/milestones/${milestoneId}`, dto).then(unwrap),

  assignTeamMember: (id: number, dto: AssignTeamMemberDto) =>
    api.post<ApiEnvelope<AssignmentDto>>(`/projects/${id}/team`, dto).then(unwrap),

  unassignTeamMember: (id: number, employeeId: number) =>
    api
      .delete<ApiEnvelope<{ message: string }>>(`/projects/${id}/team/${employeeId}`)
      .then(unwrap),
  deleteProject: (id: number) =>
    api
      .delete<ApiEnvelope<{ success: boolean }>>(`/projects/${id}`)
      .then(unwrap),
}
