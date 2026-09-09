import { Prisma, type User } from "../generated/prisma/index.js";
declare const withCounts: {
    _count: {
        select: {
            ownedLeads: true;
            ownedCustomers: true;
            projectAssignments: true;
            interactions: true;
        };
    };
};
export type PrismaUserWithCounts = Prisma.UserGetPayload<{
    include: typeof withCounts;
}>;
export declare const userRepository: {
    findById: (id: number) => Promise<User | null>;
    findByEmail: (email: string) => Promise<User | null>;
    findByIdWithDetails: (id: number) => Promise<PrismaUserWithCounts | null>;
    findMany: (where: Prisma.UserWhereInput, skip: number, take: number) => Promise<PrismaUserWithCounts[]>;
    count: (where: Prisma.UserWhereInput) => Promise<number>;
    create: (data: Prisma.UserCreateInput) => Promise<PrismaUserWithCounts>;
    update: (id: number, data: Prisma.UserUpdateInput) => Promise<PrismaUserWithCounts>;
    delete: (id: number) => Promise<User>;
    /** Update only the fields a user can change themselves */
    updateProfile: (id: number, data: {
        name?: string;
    }) => Promise<User>;
    /** Persist a new hashed password and clear the forcePasswordChange flag */
    updatePassword: (id: number, hashedPassword: string) => Promise<User>;
    /** Persist a new avatar URL */
    updateAvatar: (id: number, avatarUrl: string) => Promise<User>;
};
export {};
//# sourceMappingURL=user.repository.d.ts.map