import { z } from 'zod';
import { ProjectStage, type Project, type Milestone, type ProjectAssignment, type ProjectStageHistory, MilestoneStatus, type User, type Customer } from '../generated/prisma/index.js';
import { type UserSummaryDto } from './user.dto.js';
import { type CustomerSummaryDto } from './customer.dto.js';
export declare const createProjectSchema: z.ZodObject<{
    customerId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    endDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export type CreateProjectDto = z.infer<typeof createProjectSchema>;
export declare const updateProjectSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    endDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;
export declare const changeProjectStageSchema: z.ZodObject<{
    newStage: z.ZodEnum<{
        REQUIREMENTS: 'REQUIREMENTS';
        DESIGN: 'DESIGN';
        DEVELOPMENT: 'DEVELOPMENT';
        TESTING: 'TESTING';
        DEPLOYMENT: 'DEPLOYMENT';
        LIVE: 'LIVE';
    }>;
}, z.core.$strip>;
export type ChangeProjectStageDto = z.infer<typeof changeProjectStageSchema>;
export declare const listProjectsQuerySchema: z.ZodObject<{
    customerId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    stage: z.ZodOptional<z.ZodEnum<{
        REQUIREMENTS: 'REQUIREMENTS';
        DESIGN: 'DESIGN';
        DEVELOPMENT: 'DEVELOPMENT';
        TESTING: 'TESTING';
        DEPLOYMENT: 'DEPLOYMENT';
        LIVE: 'LIVE';
    }>>;
    assignedEmployeeId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type ListProjectsQueryDto = z.infer<typeof listProjectsQuerySchema>;
export declare const createMilestoneSchema: z.ZodObject<{
    title: z.ZodString;
    dueDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export type CreateMilestoneDto = z.infer<typeof createMilestoneSchema>;
export declare const updateMilestoneSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: 'PENDING';
        IN_PROGRESS: 'IN_PROGRESS';
        DONE: 'DONE';
    }>>;
}, z.core.$strip>;
export type UpdateMilestoneDto = z.infer<typeof updateMilestoneSchema>;
export declare const createProjectAssignmentSchema: z.ZodObject<{
    employeeId: z.ZodNumber;
    roleOnProject: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateProjectAssignmentDto = z.infer<typeof createProjectAssignmentSchema>;
export interface ProjectSummaryDto {
    id: number;
    name: string;
    stage: ProjectStage;
}
export declare const toProjectSummaryDto: (project: Project) => ProjectSummaryDto;
export interface MilestoneResponseDto {
    id: number;
    projectId: number;
    title: string;
    dueDate: Date | null;
    status: MilestoneStatus;
    isOverdue: boolean;
    createdAt: Date;
}
export declare const toMilestoneResponseDto: (milestone: Milestone) => MilestoneResponseDto;
export interface ProjectAssignmentResponseDto {
    id: number;
    projectId: number;
    employee: UserSummaryDto;
    roleOnProject: string | null;
    assignedAt: Date;
}
export declare const toProjectAssignmentResponseDto: (assignment: ProjectAssignment & {
    employee: User;
}) => ProjectAssignmentResponseDto;
export interface ProjectStageHistoryResponseDto {
    id: number;
    oldStage: ProjectStage | null;
    newStage: ProjectStage;
    changedBy: UserSummaryDto;
    changedAt: Date;
}
export declare const toProjectStageHistoryResponseDto: (history: ProjectStageHistory & {
    changedBy: User;
}) => ProjectStageHistoryResponseDto;
export type ProjectWithDetail = Project & {
    customer: Customer;
    milestones: Milestone[];
    assignments: (ProjectAssignment & {
        employee: User;
    })[];
    invoices: {
        amount: {
            toString(): string;
        };
    }[];
    expenses: {
        amount: {
            toString(): string;
        };
    }[];
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
        percentComplete: number;
    };
    timeline: {
        startDate: Date | null;
        endDate: Date | null;
        isOverdue: boolean;
        daysRemaining: number | null;
    };
    financials: {
        totalInvoiced: string;
        totalExpenses: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const toProjectResponseDto: (project: ProjectWithDetail) => ProjectResponseDto;
//# sourceMappingURL=project.dto.d.ts.map