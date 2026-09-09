import { Prisma, ProjectStage, MilestoneStatus } from "../generated/prisma/index.js";
import {
    toProjectResponseDto, toMilestoneResponseDto, toProjectAssignmentResponseDto,
    type CreateProjectDto, type UpdateProjectDto, type ListProjectsQueryDto, type ProjectResponseDto,
    type CreateMilestoneDto, type UpdateMilestoneDto,
    type CreateProjectAssignmentDto
} from "../dtos/project.dto.js";
import { projectRepository } from "../repositories/project.repository.js";
import { customerRepository } from "../repositories/customer.repository.js";
import { prisma } from "../lib/primsa.js";
import { AppError } from "../utiles/error-handler.utiles.js";

export const projectService = {
    // --- Core Projects ---
    async getProjectProfile(id: number): Promise<ProjectResponseDto> {
        const project = await projectRepository.findByIdWithDetails(id);
        if (!project) throw new AppError(404, "Project not found.");
        return toProjectResponseDto(project);
    },

    async getAllProjects(filters: ListProjectsQueryDto, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const whereClause: Prisma.ProjectWhereInput = {};
        
        if (filters.customerId) whereClause.customerId = filters.customerId;
        if (filters.stage) whereClause.stage = filters.stage;
        if (filters.assignedEmployeeId) {
            whereClause.assignments = {
                some: { employeeId: filters.assignedEmployeeId }
            };
        }

        const [totalItems, projects] = await Promise.all([
            projectRepository.count(whereClause),
            projectRepository.findMany(whereClause, skip, limit)
        ]);
        
        return {
            projects: projects.map(p => toProjectResponseDto(p)),
            pagination: { page, limit, total: totalItems, totalPages: Math.ceil(totalItems / limit) }
        };
    },

    async createProject(data: CreateProjectDto): Promise<ProjectResponseDto> {
        // If no customerId provided, find or create a "General" placeholder customer
        let resolvedCustomerId = data.customerId;
        if (!resolvedCustomerId) {
            const GENERAL_NAME = "__GENERAL__";
            let general = await prisma.customer.findFirst({ where: { companyName: GENERAL_NAME } });
            if (!general) {
                general = await customerRepository.create({
                    companyName: GENERAL_NAME,
                    size: "SMALL",
                    status: "ACTIVE",
                } as Prisma.CustomerCreateInput);
            }
            resolvedCustomerId = general.id;
        }

        const project = await projectRepository.create({
            name: data.name,
            stage: ProjectStage.REQUIREMENTS,
            customer: { connect: { id: resolvedCustomerId } },
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
            ...(data.endDate !== undefined ? { endDate: data.endDate } : {})
        } as unknown as Prisma.ProjectCreateInput);

        return toProjectResponseDto(project);
    },

    async updateProject(id: number, data: UpdateProjectDto): Promise<ProjectResponseDto> {
        const current = await projectRepository.findById(id);
        if (!current) throw new AppError(404, "Project not found.");

        const updatePayload: any = {};
        if (data.name !== undefined) updatePayload.name = data.name;
        if (data.description !== undefined) updatePayload.description = data.description;
        if (data.startDate !== undefined) updatePayload.startDate = data.startDate;
        if (data.endDate !== undefined) updatePayload.endDate = data.endDate;

        const updated = await projectRepository.update(id, updatePayload as Prisma.ProjectUpdateInput);
        return toProjectResponseDto(updated);
    },

    async changeStage(id: number, newStage: ProjectStage, userId: number): Promise<ProjectResponseDto> {
        const current = await projectRepository.findById(id);
        if (!current) throw new AppError(404, "Project not found.");
        if (current.stage === newStage) return this.getProjectProfile(id);

        const [updatedProject] = await Promise.all([
            projectRepository.update(id, { stage: newStage }),
            projectRepository.logStageChange(id, current.stage, newStage, userId)
        ]);

        return toProjectResponseDto(updatedProject);
    },

    // --- Milestones ---
    async addMilestone(projectId: number, data: CreateMilestoneDto) {
        const current = await projectRepository.findById(projectId);
        if (!current) throw new AppError(404, "Project not found.");

        const milestoneInput: any = { title: data.title, status: MilestoneStatus.PENDING };
        if (data.dueDate !== undefined) milestoneInput.dueDate = data.dueDate;

        const milestone = await projectRepository.createMilestone(projectId, milestoneInput);
        return toMilestoneResponseDto(milestone);
    },

    async updateMilestone(id: number, data: UpdateMilestoneDto) {
        const current = await projectRepository.findMilestoneById(id);
        if (!current) throw new AppError(404, "Milestone not found.");

        const updatePayload: any = {};
        if (data.title !== undefined) updatePayload.title = data.title;
        if (data.dueDate !== undefined) updatePayload.dueDate = data.dueDate;
        if (data.status !== undefined) updatePayload.status = data.status;

        const updated = await projectRepository.updateMilestone(id, updatePayload);
        return toMilestoneResponseDto(updated);
    },

    // --- Assignments ---
    async assignEmployee(projectId: number, data: CreateProjectAssignmentDto) {
        const current = await projectRepository.findById(projectId);
        if (!current) throw new AppError(404, "Project not found.");

        const assignment = await projectRepository.createAssignment(projectId, data.employeeId, data.roleOnProject);
        return toProjectAssignmentResponseDto(assignment);
    },

    async unassignEmployee(projectId: number, employeeId: number) {
        await projectRepository.removeAssignment(projectId, employeeId);
        return { message: "Employee successfully unassigned from project" };
    },

    async deleteProject(id: number): Promise<void> {
        const current = await projectRepository.findById(id);
        if (!current) throw new AppError(404, "Project not found.");
        await prisma.project.delete({ where: { id } });
    }
};
