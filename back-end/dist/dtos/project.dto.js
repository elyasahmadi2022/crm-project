import { z } from 'zod';
import { ProjectStage, MilestoneStatus, } from '../generated/prisma/index.js';
import { toUserSummaryDto } from './user.dto.js';
import { toCustomerSummaryDto } from './customer.dto.js';
// ---------- Requests ----------
export const createProjectSchema = z.object({
    customerId: z.number().int().positive().optional().nullable(),
    name: z.string().min(1),
    description: z.string().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
});
export const updateProjectSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
});
export const changeProjectStageSchema = z.object({
    newStage: z.nativeEnum(ProjectStage),
});
export const listProjectsQuerySchema = z.object({
    customerId: z.coerce.number().int().positive().optional(),
    stage: z.nativeEnum(ProjectStage).optional(),
    assignedEmployeeId: z.coerce.number().int().positive().optional(),
});
export const createMilestoneSchema = z.object({
    title: z.string().min(1),
    dueDate: z.coerce.date().optional(),
});
export const updateMilestoneSchema = z.object({
    title: z.string().min(1).optional(),
    dueDate: z.coerce.date().optional(),
    status: z.nativeEnum(MilestoneStatus).optional(),
});
export const createProjectAssignmentSchema = z.object({
    employeeId: z.number().int().positive(),
    roleOnProject: z.string().optional(),
});
export const toProjectSummaryDto = (project) => ({
    id: project.id,
    name: project.name,
    stage: project.stage,
});
export const toMilestoneResponseDto = (milestone) => ({
    id: milestone.id,
    projectId: milestone.projectId,
    title: milestone.title,
    dueDate: milestone.dueDate,
    status: milestone.status,
    isOverdue: milestone.status === 'PENDING' && !!milestone.dueDate && milestone.dueDate < new Date(),
    createdAt: milestone.createdAt,
});
export const toProjectAssignmentResponseDto = (assignment) => ({
    id: assignment.id,
    projectId: assignment.projectId,
    employee: toUserSummaryDto(assignment.employee),
    roleOnProject: assignment.roleOnProject,
    assignedAt: assignment.assignedAt,
});
export const toProjectStageHistoryResponseDto = (history) => ({
    id: history.id,
    oldStage: history.oldStage,
    newStage: history.newStage,
    changedBy: toUserSummaryDto(history.changedBy),
    changedAt: history.changedAt,
});
export const toProjectResponseDto = (project) => {
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
//# sourceMappingURL=project.dto.js.map