import type { Response } from "express";
import type { PaginationMeta } from "../dtos/common.dto.js";

export interface ApiSuccessResponse<T>{
    status: "success",
    data: T,
    pagination?: PaginationMeta
}
export interface ApiErrorResponse{
    status: number,
    message: string,
    errors?: unknown
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200): Response<ApiSuccessResponse<T>> =>
    res.status(statusCode).json({ status: statusCode, data });


export const sendPaginated = <T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    statusCode = 200,
  ): Response<ApiSuccessResponse<T[]>> =>
    res.status(statusCode).json({
      status: statusCode,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

export const sendError = (
        res: Response,
        statusCode: number,
        message: string,
        errors?: unknown,
      ): Response<ApiErrorResponse> =>
        res.status(statusCode).json({ status: statusCode, message, errors })