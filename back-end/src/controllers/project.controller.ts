import type { Request, Response, NextFunction } from "express";
import {
    createProjectSchema, updateProjectSchema, listProjectsQuerySchema, changeProjectStageSchema,
    createMilestoneSchema, updateMilestoneSchema, createProjectAssignmentSchema
} from "../dtos/project.dto.js";
import { paginationSchema } from "../dtos/common.dto.js";
import { projectService } from "../services/project.service.js";
import { sendPaginated, sendSuccess } from "../utiles/api-response.utiles.js";

export const projectController = {
    // --- Projects ---
    getAll: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters = listProjectsQuerySchema.parse(req.query);
            const { page, limit } = paginationSchema.parse(req.query);
            const { projects, pagination } = await projectService.getAllProjects(filters, page, limit);
            return sendPaginated(res, projects, pagination.page, pagination.limit, pagination.total);
        } catch (error) { next(error); }
    },
    getById: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string, 10);
            const data = await projectService.getProjectProfile(id);
            return sendSuccess(res, data);
        } catch (error) { next(error); }
    },
    create: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = createProjectSchema.parse(req.body);
            const data = await projectService.createProject(body);
            return sendSuccess(res, data, 201);
        } catch (error) { next(error); }
    },
    update: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string, 10);
            const body = updateProjectSchema.parse(req.body);
            const data = await projectService.updateProject(id, body);
            return sendSuccess(res, data);
        } catch (error) { next(error); }
    },
    changeStage: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string, 10);
            const { newStage } = changeProjectStageSchema.parse(req.body);
            const userId = req.user!.id;
            const data = await projectService.changeStage(id, newStage, userId);
            return sendSuccess(res, data);
        } catch (error) { next(error); }
    },

    // --- Milestones ---
    addMilestone: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const projectId = parseInt(req.params.id as string, 10);
            const body = createMilestoneSchema.parse(req.body);
            const data = await projectService.addMilestone(projectId, body);
            return sendSuccess(res, data, 201);
        } catch (error) { next(error); }
    },
    updateMilestone: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string, 10);
            const body = updateMilestoneSchema.parse(req.body);
            const data = await projectService.updateMilestone(id, body);
            return sendSuccess(res, data);
        } catch (error) { next(error); }
    },

    // --- Assignments ---
    assignTeamMember: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const projectId = parseInt(req.params.id as string, 10);
            const body = createProjectAssignmentSchema.parse(req.body);
            const data = await projectService.assignEmployee(projectId, body);
            return sendSuccess(res, data, 201);
        } catch (error) { next(error); }
    },
    unassignTeamMember: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const projectId = parseInt(req.params.id as string, 10);
            const employeeId = parseInt(req.params.employeeId as string, 10);
            const data = await projectService.unassignEmployee(projectId, employeeId);
            return sendSuccess(res, data);
        } catch (error) { next(error); }
    },
    deleteProject: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string, 10);
            await projectService.deleteProject(id);
            return sendSuccess(res, { success: true });
        } catch (error) { next(error); }
    }
};
