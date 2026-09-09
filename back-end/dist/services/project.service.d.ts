import { ProjectStage } from "../generated/prisma/index.js";
import { type CreateProjectDto, type UpdateProjectDto, type ListProjectsQueryDto, type ProjectResponseDto, type CreateMilestoneDto, type UpdateMilestoneDto, type CreateProjectAssignmentDto } from "../dtos/project.dto.js";
export declare const projectService: {
    getProjectProfile(id: number): Promise<ProjectResponseDto>;
    getAllProjects(filters: ListProjectsQueryDto, page?: number, limit?: number): Promise<{
        projects: ProjectResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    createProject(data: CreateProjectDto): Promise<ProjectResponseDto>;
    updateProject(id: number, data: UpdateProjectDto): Promise<ProjectResponseDto>;
    changeStage(id: number, newStage: ProjectStage, userId: number): Promise<ProjectResponseDto>;
    addMilestone(projectId: number, data: CreateMilestoneDto): Promise<import("../dtos/project.dto.js").MilestoneResponseDto>;
    updateMilestone(id: number, data: UpdateMilestoneDto): Promise<import("../dtos/project.dto.js").MilestoneResponseDto>;
    assignEmployee(projectId: number, data: CreateProjectAssignmentDto): Promise<import("../dtos/project.dto.js").ProjectAssignmentResponseDto>;
    unassignEmployee(projectId: number, employeeId: number): Promise<{
        message: string;
    }>;
    deleteProject(id: number): Promise<void>;
};
//# sourceMappingURL=project.service.d.ts.map