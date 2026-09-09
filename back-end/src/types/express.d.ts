import type { UserRole } from "../generated/prisma/index.js"

declare global{
    namespace Express{
        interface Request {
            user?: {
                id: number,
                role: UserRole
            }
        }
    }
}