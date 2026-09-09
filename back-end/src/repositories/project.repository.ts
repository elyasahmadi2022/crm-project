import { Prisma, type Project, type Milestone, type ProjectAssignment } from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.js";


// This mirrors the exact prisma.project.findUnique include query requested in your DTO comments
const withDetails = {
    customer: true,
    milestones: true,
    assignments: { include: { employee: true } },
    invoices: { select: { amount: true } },
    expenses: { select: { amount: true } },
} satisfies Prisma.ProjectInclude;

export type PrismaProjectWithDetail = Prisma.ProjectGetPayload<{ include: typeof withDetails }>;

export const projectRepository = {
    // --- Projects ---
    findById: (id: number): Promise<Project | null> => {
        return prisma.project.findUnique({ where: { id } });
    },
    findByIdWithDetails: (id: number): Promise<PrismaProjectWithDetail | null> => {
        return prisma.project.findUnique({ where: { id }, include: withDetails });
    },
    findMany: (where: Prisma.ProjectWhereInput, skip: number, take: number): Promise<PrismaProjectWithDetail[]> => {
        return prisma.project.findMany({ where, skip, take, include: withDetails, orderBy: { createdAt: 'desc' } });
    },
    count: (where: Prisma.ProjectWhereInput): Promise<number> => {
        return prisma.project.count({ where });
    },
    create: (data: Prisma.ProjectCreateInput): Promise<PrismaProjectWithDetail> => {
        return prisma.project.create({ data, include: withDetails });
    },
    update: (id: number, data: Prisma.ProjectUpdateInput): Promise<PrismaProjectWithDetail> => {
        return prisma.project.update({ where: { id }, data, include: withDetails });
    },
    logStageChange: (projectId: number, oldStage: any, newStage: any, userId: number) => {
        return prisma.projectStageHistory.create({
            data: { projectId, oldStage, newStage, changedById: userId }
        });
    },

    // --- Milestones ---
    findMilestoneById: (id: number): Promise<Milestone | null> => {
        return prisma.milestone.findUnique({ where: { id } });
    },
    createMilestone: (projectId: number, data: Prisma.MilestoneCreateWithoutProjectInput): Promise<Milestone> => {
        return prisma.milestone.create({ data: { ...data, project: { connect: { id: projectId } } } });
    },
    updateMilestone: (id: number, data: Prisma.MilestoneUpdateInput): Promise<Milestone> => {
        return prisma.milestone.update({ where: { id }, data });
    },

    // --- Assignments ---
    createAssignment: (projectId: number, employeeId: number, roleOnProject?: string) => {
        return prisma.projectAssignment.create({
            data: { projectId, employeeId, roleOnProject: roleOnProject || null },
            include: { employee: true }
        });
    },
    removeAssignment: (projectId: number, employeeId: number) => {
        return prisma.projectAssignment.deleteMany({
            where: { projectId, employeeId }
        });
    }
};
