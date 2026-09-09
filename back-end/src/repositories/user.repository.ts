import { Prisma, type User } from "../generated/prisma/index.js"
import { prisma } from "../lib/primsa.js"

const withCounts = {
    _count: {
        select: {
            ownedLeads: true,
            ownedCustomers: true,
            projectAssignments: true,
            interactions: true
        }
    }
} satisfies Prisma.UserInclude

// Cleanly generate the return type combining User and the relations inside withCounts
export type PrismaUserWithCounts = Prisma.UserGetPayload<{ include: typeof withCounts }>;

export const userRepository = {
    findById: (id: number): Promise<User | null> => {
        return prisma.user.findUnique({ where: { id } })
    },

    findByEmail: (email: string): Promise<User | null> => {
        return prisma.user.findUnique({ where: { email } })
    },

    findByIdWithDetails: (id: number): Promise<PrismaUserWithCounts | null> => {
        return prisma.user.findUnique({ where: { id }, include: withCounts })
    },

    findMany: (
        where: Prisma.UserWhereInput,
        skip: number,
        take: number
    ): Promise<PrismaUserWithCounts[]> => {
        return prisma.user.findMany({
            where,
            skip,
            take,
            include: withCounts,
            orderBy: { createdAt: "desc" }
        })
    },

    count: (where: Prisma.UserWhereInput): Promise<number> => {
        return prisma.user.count({ where })
    },

    create: (data: Prisma.UserCreateInput): Promise<PrismaUserWithCounts> => {
        return prisma.user.create({ data, include: withCounts })
    },

    update: (id: number, data: Prisma.UserUpdateInput): Promise<PrismaUserWithCounts> => {
        return prisma.user.update({ where: { id }, data, include: withCounts })
    },

    delete: (id: number): Promise<User> => {
        return prisma.user.delete({ where: { id } })
    },

    // -------------------------------------------------------
    // Profile helpers (used by the auth / profile endpoints)
    // -------------------------------------------------------

    /** Update only the fields a user can change themselves */
    updateProfile: (id: number, data: { name?: string }): Promise<User> => {
        return prisma.user.update({ where: { id }, data })
    },

    /** Persist a new hashed password and clear the forcePasswordChange flag */
    updatePassword: (id: number, hashedPassword: string): Promise<User> => {
        return prisma.user.update({
            where: { id },
            data: { password: hashedPassword, forcePasswordChange: false },
        })
    },

    /** Persist a new avatar URL */
    updateAvatar: (id: number, avatarUrl: string): Promise<User> => {
        return prisma.user.update({ where: { id }, data: { avatarUrl } })
    },
}
