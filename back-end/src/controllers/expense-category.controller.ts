import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { expenseCategoryService } from "../services/expense-category.service.js";
import { sendSuccess } from "../utiles/api-response.utiles.js";

const createSchema = z.object({
  name:        z.string().min(1).max(50).trim(),
  color:       z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color like #ff0000"),
  description: z.string().max(200).optional(),
});

const updateSchema = createSchema.partial();

function parseId(id: unknown) {
  const n = parseInt(String(id), 10);
  if (isNaN(n)) throw new Error("Invalid id");
  return n;
}

export const expenseCategoryController = {
  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      return sendSuccess(res, await expenseCategoryService.getAll());
    } catch (e) { next(e); }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      return sendSuccess(res, await expenseCategoryService.getById(parseId(req.params.id)));
    } catch (e) { next(e); }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = createSchema.parse(req.body);
      return sendSuccess(res, await expenseCategoryService.create(dto), 201);
    } catch (e) { next(e); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id  = parseId(req.params.id);
      const dto = updateSchema.parse(req.body);
      return sendSuccess(res, await expenseCategoryService.update(id, dto));
    } catch (e) { next(e); }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await expenseCategoryService.delete(parseId(req.params.id));
      return sendSuccess(res, { success: true });
    } catch (e) { next(e); }
  },
};
