import { z } from "zod";
export const idParamSchema = z.object({
    id: z.coerce.number().int().positive()
});
export const paginationSchema = z.object({
    page: z.coerce.number().positive().default(1),
    limit: z.coerce.number().positive().default(10)
});
//# sourceMappingURL=common.dto.js.map