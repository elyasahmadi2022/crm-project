import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/index.js";
import { sendError } from "./api-response.utiles.js";

export class AppError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = "AppError";
    }
}

export const errorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    // Zod validation errors — list every field that failed
    if (err instanceof ZodError) {
        const messages = err.issues.map((e) =>
            e.path.length ? `${e.path.map(String).join(".")}: ${e.message}` : e.message
        );
        return sendError(res, 400, "Validation failed. Please check your input.", messages);
    }

    // Known application errors (thrown intentionally)
    if (err instanceof AppError) {
        return sendError(res, err.statusCode, err.message);
    }

    // Prisma known request errors (e.g. unique constraint, not found)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            const field = (err.meta?.target as string[])?.join(", ") ?? "field";
            return sendError(res, 409, `A record with this ${field} already exists.`);
        }
        if (err.code === "P2025") {
            return sendError(res, 404, "The requested record was not found.");
        }
        return sendError(res, 400, "A database error occurred. Please try again.");
    }

    // Prisma validation errors (wrong types, unknown fields — e.g. stale client)
    if (err instanceof Prisma.PrismaClientValidationError) {
        console.error("[Prisma Validation Error]", err.message);
        return sendError(
            res,
            500,
            "A server configuration error occurred. Please contact support."
        );
    }

    // Generic Error instances (thrown with `throw new Error(...)`)
    if (err instanceof Error) {
        return sendError(res, 500, err.message);
    }

    // Absolute fallback
    console.error("[Unhandled Error]", err);
    return sendError(res, 500, "An unexpected error occurred. Please try again.");
};

export const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
    (req: Request, res: Response, next: NextFunction) =>
        Promise.resolve(fn(req, res, next)).catch(next);
