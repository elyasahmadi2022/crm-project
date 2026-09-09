import { Prisma } from "../generated/prisma/index.js";
import { toUserResponseDto } from "../dtos/user.dto.js";
import { userRepository } from "../repositories/user.repository.js";
import { AppError } from "../utiles/error-handler.utiles.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const userService = {
    async getUserById(id) {
        const user = await userRepository.findById(id);
        if (!user)
            throw new AppError(404, "User not found.");
        return user;
    },
    async getUserByEmail(email) {
        const user = await userRepository.findByEmail(email);
        if (!user)
            throw new AppError(404, "User not found.");
        return user;
    },
    async getUserProfile(id) {
        const user = await userRepository.findByIdWithDetails(id);
        if (!user)
            throw new AppError(404, "User not found.");
        return toUserResponseDto(user);
    },
    async getAllUsers(filters, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const whereClause = {};
        if (filters.role)
            whereClause.role = filters.role;
        if (filters.isActive !== undefined)
            whereClause.isActive = filters.isActive;
        const [totalItems, users] = await Promise.all([
            userRepository.count(whereClause),
            userRepository.findMany(whereClause, skip, limit)
        ]);
        return {
            users: users.map(user => toUserResponseDto(user)),
            pagination: { page, limit, total: totalItems, totalPages: Math.ceil(totalItems / limit) }
        };
    },
    async countUsers(filters) {
        const whereClause = {};
        if (filters.role)
            whereClause.role = filters.role;
        if (filters.isActive !== undefined)
            whereClause.isActive = filters.isActive;
        return userRepository.count(whereClause);
    },
    async createUser(data) {
        const existing = await userRepository.findByEmail(data.email);
        if (existing)
            throw new AppError(409, "A user with this email already exists.");
        // Use the provided password if given, otherwise assign a default temporary one
        const rawPassword = data.password?.trim() || "WelcomeLuilala2026!";
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const user = await userRepository.create({
            name: data.name,
            email: data.email,
            role: data.role,
            password: hashedPassword,
            ...(data.salary !== undefined && { salary: data.salary }),
            ...(data.position !== undefined && { position: data.position }),
            ...(data.department !== undefined && { department: data.department }),
            ...(data.joinDate ? { joinDate: new Date(data.joinDate) } : {}),
        });
        return toUserResponseDto(user);
    },
    async updateUser(id, data) {
        const currentUser = await userRepository.findById(id);
        if (!currentUser)
            throw new AppError(404, "User not found.");
        if (data.email && data.email !== currentUser.email) {
            const emailExists = await userRepository.findByEmail(data.email);
            if (emailExists)
                throw new AppError(409, "This email address is already in use.");
        }
        const updatedUser = await userRepository.update(id, data);
        return toUserResponseDto(updatedUser);
    },
    async deleteUser(id) {
        const currentUser = await userRepository.findById(id);
        if (!currentUser)
            throw new AppError(404, "User not found.");
        await userRepository.delete(id);
        return { message: "User successfully deleted." };
    },
    async registerFace(id, imageBase64, faceDescriptor) {
        const user = await userRepository.findById(id);
        if (!user)
            throw new AppError(404, "User not found.");
        // Create directory structure: uploads/attendance/{username}
        const uploadsDir = path.join(__dirname, "../../uploads/attendance", user.name.replace(/\s+/g, "_"));
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        // Save the image
        const timestamp = Date.now();
        const imagePath = path.join(uploadsDir, `face_${timestamp}.jpg`);
        // Remove base64 prefix if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        fs.writeFileSync(imagePath, buffer);
        // Update user with face embedding
        const updatedUser = await userRepository.update(id, {
            faceEmbedding: JSON.stringify(faceDescriptor),
            avatarUrl: `/uploads/attendance/${user.name.replace(/\s+/g, "_")}/face_${timestamp}.jpg`
        });
        return toUserResponseDto(updatedUser);
    }
};
//# sourceMappingURL=user.service.js.map