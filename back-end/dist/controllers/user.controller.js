import { createuUserSchema, updateUserSchema, listUsersQuerySchema } from "../dtos/user.dto.js";
import { paginationSchema } from "../dtos/common.dto.js";
import { userService } from "../services/user.service.js";
import { sendPaginated, sendSuccess } from "../utiles/api-response.utiles.js";
const parseId = (param) => parseInt(Array.isArray(param) ? (param[0] ?? "0") : (param ?? "0"), 10);
export const userController = {
    getAll: async (req, res, next) => {
        try {
            const filters = listUsersQuerySchema.parse(req.query);
            const { page, limit } = paginationSchema.parse(req.query);
            const { users, pagination } = await userService.getAllUsers(filters, page, limit);
            return sendPaginated(res, users, pagination.page, pagination.limit, pagination.total);
        }
        catch (error) {
            next(error);
        }
    },
    getProfile: async (req, res, next) => {
        try {
            const id = parseId(req.params.id);
            const profile = await userService.getUserProfile(id);
            return sendSuccess(res, profile);
        }
        catch (error) {
            next(error);
        }
    },
    create: async (req, res, next) => {
        try {
            const validatedData = createuUserSchema.parse(req.body);
            const newUser = await userService.createUser(validatedData);
            return sendSuccess(res, newUser, 201);
        }
        catch (error) {
            next(error);
        }
    },
    update: async (req, res, next) => {
        try {
            const id = parseId(req.params.id);
            const validatedData = updateUserSchema.parse(req.body);
            const updatedUser = await userService.updateUser(id, validatedData);
            return sendSuccess(res, updatedUser);
        }
        catch (error) {
            next(error);
        }
    },
    delete: async (req, res, next) => {
        try {
            const id = parseId(req.params.id);
            await userService.deleteUser(id);
            return sendSuccess(res, { success: true });
        }
        catch (error) {
            next(error);
        }
    },
    registerFace: async (req, res, next) => {
        try {
            const id = parseId(req.params.id);
            const { image, faceDescriptor } = req.body;
            if (!image || !faceDescriptor) {
                throw new Error("Image and face descriptor are required");
            }
            const updatedUser = await userService.registerFace(id, image, faceDescriptor);
            return sendSuccess(res, updatedUser);
        }
        catch (error) {
            next(error);
        }
    }
};
//# sourceMappingURL=user.controller.js.map