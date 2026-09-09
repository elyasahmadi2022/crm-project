import {z} from "zod"
export const idParamSchema = z.object({
    id: z.coerce.number().int().positive()
})

export type idParamDto = z.infer<typeof idParamSchema>

export const paginationSchema = z.object({
    page: z.coerce.number().positive().default(1),
    limit: z.coerce.number().positive().default(10)
})
export type paginationDto = z.infer<typeof paginationSchema>
export interface PaginationMeta{
    page: number,
    limit: number,
    total: number,
    totalPages: number
}