import { Prisma } from "../generated/prisma/index.js";
import { type CreateUserDto, type ListUsersQueryDto, type UpdateUserDto, type UserResponseDto } from "../dtos/user.dto.js";
export declare const userService: {
    getUserById(id: number): Promise<{
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
    }>;
    getUserByEmail(email: string): Promise<{
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
    }>;
    getUserProfile(id: number): Promise<UserResponseDto>;
    getAllUsers(filters: ListUsersQueryDto, page?: number, limit?: number): Promise<{
        users: UserResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    countUsers(filters: ListUsersQueryDto): Promise<number>;
    createUser(data: CreateUserDto): Promise<UserResponseDto>;
    updateUser(id: number, data: UpdateUserDto): Promise<UserResponseDto>;
    deleteUser(id: number): Promise<{
        message: string;
    }>;
    registerFace(id: number, imageBase64: string, faceDescriptor: number[]): Promise<UserResponseDto>;
};
//# sourceMappingURL=user.service.d.ts.map