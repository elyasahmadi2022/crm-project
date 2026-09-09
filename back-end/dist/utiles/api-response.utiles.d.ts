import type { Response } from "express";
import type { PaginationMeta } from "../dtos/common.dto.js";
export interface ApiSuccessResponse<T> {
    status: "success";
    data: T;
    pagination?: PaginationMeta;
}
export interface ApiErrorResponse {
    status: number;
    message: string;
    errors?: unknown;
}
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
export declare const sendSuccess: <T>(res: Response, data: T, statusCode?: number) => Response<ApiSuccessResponse<T>>;
export declare const sendPaginated: <T>(res: Response, data: T[], page: number, limit: number, total: number, statusCode?: number) => Response<ApiSuccessResponse<T[]>>;
export declare const sendError: (res: Response, statusCode: number, message: string, errors?: unknown) => Response<ApiErrorResponse>;
//# sourceMappingURL=api-response.utiles.d.ts.map