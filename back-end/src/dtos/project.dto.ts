import { z } from 'zod';
import {
    ProjectStage,
 type Project,
 type Milestone,
 type ProjectAssignment,
 type ProjectStageHistory,
 MilestoneStatus,
    type  User,
 type Customer,
} from '../generated/prisma/index.js';
import { toUserSummaryDto, type UserSummaryDto } from './user.dto.js';
import { toCustomerSummaryDto, type CustomerSummaryDto } from './customer.dto.js';

// ---------- Requests ----------

export const createProjectSchema = z.object({
  customerId: z.number().int().positive().optional().nullable(),
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export type CreateProjectDto = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;

export const changeProjectStageSchema = z.object({
  newStage: z.nativeEnum(ProjectStage),
});
export type ChangeProjectStageDto = z.infer<typeof changeProjectStageSchema>;

export const listProjectsQuerySchema = z.object({
  customerId: z.coerce.number().int().positive().optional(),
  stage: z.nativeEnum(ProjectStage).optional(),
  assignedEmployeeId: z.coerce.number().int().positive().optional(),
});
export type ListProjectsQueryDto = z.infer<typeof listProjectsQuerySchema>;

export const createMilestoneSchema = z.object({
  title: z.string().min(1),
  dueDate: z.coerce.date().optional(),
  assignedEmployeeId: z.number().int().positive().optional(),
});
export type CreateMilestoneDto = z.infer<typeof createMilestoneSchema>;

export const updateMilestoneSchema = z.object({
  title: z.string().min(1).optional(),
  dueDate: z.coerce.date().optional(),
  status: z.nativeEnum(MilestoneStatus).optional(),
  assignedEmployeeId: z.number().int().positive().nullable().optional(),
});
export type UpdateMilestoneDto = z.infer<typeof updateMilestoneSchema>;

export const createProjectAssignmentSchema = z.object({
  employeeId: z.number().int().positive(),
  roleOnProject: z.string().optional(),
});
export type CreateProjectAssignmentDto = z.infer<typeof createProjectAssignmentSchema>;

// ---------- Response ----------

// Minimal shape for embedding (Invoice.project, Expense.project)
export interface ProjectSummaryDto {
  id: number;
  name: string;
  stage: ProjectStage;
}

export const toProjectSummaryDto = (project: Project): ProjectSummaryDto => ({
  id: project.id,
  name: project.name,
  stage: project.stage,
});

export interface MilestoneResponseDto {
  id: number;
  projectId: number;
  title: string;
  dueDate: Date | null;
  status: MilestoneStatus;
  isOverdue: boolean;
  createdAt: Date;
  assignedEmployeeId: number | null;
  assignedEmployee: { id: number; name: string; avatarUrl: string | null } | null;
}

export const toMilestoneResponseDto = (milestone: any): MilestoneResponseDto => ({
  id: milestone.id,
  projectId: milestone.projectId,
  title: milestone.title,
  dueDate: milestone.dueDate,
  status: milestone.status,
  isOverdue: milestone.status === 'PENDING' && !!milestone.dueDate && milestone.dueDate < new Date(),
  createdAt: milestone.createdAt,
  assignedEmployeeId: milestone.assignedEmployeeId ?? null,
  assignedEmployee: milestone.assignedEmployee ?? null,
});

export interface ProjectAssignmentResponseDto {
  id: number;
  projectId: number;
  employee: UserSummaryDto;
  roleOnProject: string | null;
  assignedAt: Date;
}

export const toProjectAssignmentResponseDto = (
  assignment: ProjectAssignment & { employee: User },
): ProjectAssignmentResponseDto => ({
  id: assignment.id,
  projectId: assignment.projectId,
  employee: toUserSummaryDto(assignment.employee),
  roleOnProject: assignment.roleOnProject,
  assignedAt: assignment.assignedAt,
});

export interface ProjectStageHistoryResponseDto {
  id: number;
  oldStage: ProjectStage | null;
  newStage: ProjectStage;
  changedBy: UserSummaryDto;
  changedAt: Date;
}

export const toProjectStageHistoryResponseDto = (
  history: ProjectStageHistory & { changedBy: User },
): ProjectStageHistoryResponseDto => ({
  id: history.id,
  oldStage: history.oldStage,
  newStage: history.newStage,
  changedBy: toUserSummaryDto(history.changedBy),
  changedAt: history.changedAt,
});

// Full detail — fetch with:
// prisma.project.findUnique({ where: { id }, include: {
//   customer: true,
//   milestones: true,
//   assignments: { include: { employee: true } },
//   invoices: { select: { amount: true } },
//   expenses: { select: { amount: true } },
// } })
export type ProjectWithDetail = Project & {
  customer: Customer;
  milestones: Milestone[];
  assignments: (ProjectAssignment & { employee: User })[];
  invoices: { amount: { toString(): string } }[];
  expenses: { amount: { toString(): string } }[];
};

export interface ProjectResponseDto {
  id: number;
  name: string;
  description: string | null;
  stage: ProjectStage;
  customer: CustomerSummaryDto;
  team: UserSummaryDto[];
  milestones: MilestoneResponseDto[];
  assignments: ProjectAssignmentResponseDto[];
  progress: {
    milestonesTotal: number;
    milestonesDone: number;
    percentComplete: number; // 0-100
  };
  timeline: {
    startDate: Date | null;
    endDate: Date | null;
    isOverdue: boolean; // endDate passed and stage !== LIVE
    daysRemaining: number | null; // negative if overdue
  };
  financials: {
    totalInvoiced: string;
    totalExpenses: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const toProjectResponseDto = (project: ProjectWithDetail): ProjectResponseDto => {
  const milestonesTotal = project.milestones.length;
  const milestonesDone = project.milestones.filter((m) => m.status === 'DONE').length;
  const now = new Date();
  const isOverdue = !!project.endDate && project.endDate < now && project.stage !== 'LIVE';
  const daysRemaining = project.endDate
    ? Math.ceil((project.endDate.getTime() - now.getTime()) / 86_400_000)
    : null;

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    stage: project.stage,
    customer: toCustomerSummaryDto(project.customer),
    team: project.assignments.map((a) => toUserSummaryDto(a.employee)),
    milestones: project.milestones.map(toMilestoneResponseDto),
    assignments: project.assignments.map(toProjectAssignmentResponseDto),
    progress: {
      milestonesTotal,
      milestonesDone,
      percentComplete: milestonesTotal > 0 ? Math.round((milestonesDone / milestonesTotal) * 100) : 0,
    },
    timeline: {
      startDate: project.startDate,
      endDate: project.endDate,
      isOverdue,
      daysRemaining,
    },
    financials: {
      totalInvoiced: project.invoices.reduce((sum, i) => sum + Number(i.amount), 0).toFixed(2),
      totalExpenses: project.expenses.reduce((sum, e) => sum + Number(e.amount), 0).toFixed(2),
    },
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
};