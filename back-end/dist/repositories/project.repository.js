import { Prisma } from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.js";
// This mirrors the exact prisma.project.findUnique include query requested in your DTO comments
const withDetails = {
    customer: true,
    milestones: true,
    assignments: { include: { employee: true } },
    invoices: { select: { amount: true } },
    expenses: { select: { amount: true } },
};
export const projectRepository = {
    // --- Projects ---
    findById: (id) => {
        return prisma.project.findUnique({ where: { id } });
    },
    findByIdWithDetails: (id) => {
        return prisma.project.findUnique({ where: { id }, include: withDetails });
    },
    findMany: (where, skip, take) => {
        return prisma.project.findMany({ where, skip, take, include: withDetails, orderBy: { createdAt: 'desc' } });
    },
    count: (where) => {
        return prisma.project.count({ where });
    },
    create: (data) => {
        return prisma.project.create({ data, include: withDetails });
    },
    update: (id, data) => {
        return prisma.project.update({ where: { id }, data, include: withDetails });
    },
    logStageChange: (projectId, oldStage, newStage, userId) => {
        return prisma.projectStageHistory.create({
            data: { projectId, oldStage, newStage, changedById: userId }
        });
    },
    // --- Milestones ---
    findMilestoneById: (id) => {
        return prisma.milestone.findUnique({ where: { id } });
    },
    createMilestone: (projectId, data) => {
        return prisma.milestone.create({ data: { ...data, project: { connect: { id: projectId } } } });
    },
    updateMilestone: (id, data) => {
        return prisma.milestone.update({ where: { id }, data });
    },
    // --- Assignments ---
    createAssignment: (projectId, employeeId, roleOnProject) => {
        return prisma.projectAssignment.create({
            data: { projectId, employeeId, roleOnProject: roleOnProject || null },
            include: { employee: true }
        });
    },
    removeAssignment: (projectId, employeeId) => {
        return prisma.projectAssignment.deleteMany({
            where: { projectId, employeeId }
        });
    }
};
//# sourceMappingURL=project.repository.js.map