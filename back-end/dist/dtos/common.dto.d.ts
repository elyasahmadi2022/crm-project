import { z } from "zod";
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export type idParamDto = z.infer<typeof idParamSchema>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type paginationDto = z.infer<typeof paginationSchema>;
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
//# sourceMappingURL=common.dto.d.ts.map