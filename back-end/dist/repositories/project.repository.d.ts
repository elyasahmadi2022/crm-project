import { Prisma, type Project, type Milestone } from "../generated/prisma/index.js";
declare const withDetails: {
    customer: true;
    milestones: true;
    assignments: {
        include: {
            employee: true;
        };
    };
    invoices: {
        select: {
            amount: true;
        };
    };
    expenses: {
        select: {
            amount: true;
        };
    };
};
export type PrismaProjectWithDetail = Prisma.ProjectGetPayload<{
    include: typeof withDetails;
}>;
export declare const projectRepository: {
    findById: (id: number) => Promise<Project | null>;
    findByIdWithDetails: (id: number) => Promise<PrismaProjectWithDetail | null>;
    findMany: (where: Prisma.ProjectWhereInput, skip: number, take: number) => Promise<PrismaProjectWithDetail[]>;
    count: (where: Prisma.ProjectWhereInput) => Promise<number>;
    create: (data: Prisma.ProjectCreateInput) => Promise<PrismaProjectWithDetail>;
    update: (id: number, data: Prisma.ProjectUpdateInput) => Promise<PrismaProjectWithDetail>;
    logStageChange: (projectId: number, oldStage: any, newStage: any, userId: number) => Prisma.Prisma__ProjectStageHistoryClient<{
        id: number;
        projectId: number;
        oldStage: import("../generated/prisma/index.js").$Enums.ProjectStage | null;
        newStage: import("../generated/prisma/index.js").$Enums.ProjectStage;
        changedById: number;
        changedAt: Date;
    }, never, import("../generated/prisma/runtime/client.js").DefaultArgs, Prisma.PrismaClientOptions>;
    findMilestoneById: (id: number) => Promise<Milestone | null>;
    createMilestone: (projectId: number, data: Prisma.MilestoneCreateWithoutProjectInput) => Promise<Milestone>;
    updateMilestone: (id: number, data: Prisma.MilestoneUpdateInput) => Promise<Milestone>;
    createAssignment: (projectId: number, employeeId: number, roleOnProject?: string) => Prisma.Prisma__ProjectAssignmentClient<{
        employee: {
            id: number;
            name: string;
            email: string;
            role: import("../generated/prisma/index.js").$Enums.UserRole;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            password: string;
            avatarUrl: string | null;
            forcePasswordChange: boolean;
            salary: Prisma.Decimal | null;
            position: string | null;
            department: string | null;
            joinDate: Date | null;
            faceEmbedding: string | null;
        };
    } & {
        id: number;
        projectId: number;
        employeeId: number;
        roleOnProject: string | null;
        assignedAt: Date;
    }, never, import("../generated/prisma/runtime/client.js").DefaultArgs, Prisma.PrismaClientOptions>;
    removeAssignment: (projectId: number, employeeId: number) => Prisma.PrismaPromise<Prisma.BatchPayload>;
};
export {};
//# sourceMappingURL=project.repository.d.ts.map