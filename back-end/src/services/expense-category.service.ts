/**
 * services/expense-category.service.ts
 *
 * Manages the ExpenseCustomCategory table — fully user-created categories.
 * When an expense uses one of these, Expense.category = "CUSTOM" and
 * Expense.customCategoryId points here.
 *
 * The 7 built-in enum values (SOFTWARE, HARDWARE …) still work as before
 * and are listed alongside custom ones in the UI.
 */

import { prisma } from "../lib/primsa.js";
import { AppError } from "../utiles/error-handler.utiles.js";

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CustomCategoryDto {
  id:          number;
  name:        string;
  color:       string;
  description: string | null;
  expenseCount: number;
  createdAt:   string;
  updatedAt:   string;
}

export interface CreateCustomCategoryDto {
  name:         string;
  color:        string;
  description?: string | undefined;
}

export type UpdateCustomCategoryDto = {
  name?:        string | undefined;
  color?:       string | undefined;
  description?: string | undefined;
};

// ── Service ───────────────────────────────────────────────────────────────────

export const expenseCategoryService = {
  async getAll(): Promise<CustomCategoryDto[]> {
    const rows = await prisma.expenseCustomCategory.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { expenses: true } } },
    });
    return rows.map(toDto);
  },

  async getById(id: number): Promise<CustomCategoryDto> {
    const row = await prisma.expenseCustomCategory.findUnique({
      where: { id },
      include: { _count: { select: { expenses: true } } },
    });
    if (!row) throw new AppError(404, "Category not found.");
    return toDto(row);
  },

  async create(dto: CreateCustomCategoryDto): Promise<CustomCategoryDto> {
    // MySQL doesn't support mode: "insensitive" — fetch all and compare in JS
    const existing = await prisma.expenseCustomCategory.findFirst({
      where: { name: dto.name.trim() },
    });
    if (!existing) {
      // also check case-insensitively in JS
      const all = await prisma.expenseCustomCategory.findMany({ select: { name: true } });
      const conflict = all.find(r => r.name.toLowerCase() === dto.name.trim().toLowerCase());
      if (conflict) throw new AppError(409, `A category named "${dto.name}" already exists.`);
    } else {
      throw new AppError(409, `A category named "${dto.name}" already exists.`);
    }

    const row = await prisma.expenseCustomCategory.create({
      data: {
        name:        dto.name.trim(),
        color:       dto.color,
        description: dto.description?.trim() ?? null,
      },
      include: { _count: { select: { expenses: true } } },
    });
    return toDto(row);
  },

  async update(id: number, dto: UpdateCustomCategoryDto): Promise<CustomCategoryDto> {
    const existing = await prisma.expenseCustomCategory.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Category not found.");

    if (dto.name && dto.name !== existing.name) {
      const all = await prisma.expenseCustomCategory.findMany({ select: { id: true, name: true } });
      const conflict = all.find(r => r.id !== id && r.name.toLowerCase() === dto.name!.trim().toLowerCase());
      if (conflict) throw new AppError(409, `A category named "${dto.name}" already exists.`);
    }

    const row = await prisma.expenseCustomCategory.update({
      where: { id },
      data: {
        ...(dto.name        !== undefined ? { name:        dto.name.trim() }        : {}),
        ...(dto.color       !== undefined ? { color:       dto.color }              : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() ?? null } : {}),
      },
      include: { _count: { select: { expenses: true } } },
    });
    return toDto(row);
  },

  async delete(id: number): Promise<void> {
    const existing = await prisma.expenseCustomCategory.findUnique({
      where: { id },
      include: { _count: { select: { expenses: true } } },
    });
    if (!existing) throw new AppError(404, "Category not found.");
    if (existing._count.expenses > 0) {
      throw new AppError(
        409,
        `Cannot delete — ${existing._count.expenses} expense(s) use this category. Re-categorise them first.`,
      );
    }
    await prisma.expenseCustomCategory.delete({ where: { id } });
  },
};

// ── Mapper ────────────────────────────────────────────────────────────────────

type RowWithCount = {
  id: number;
  name: string;
  color: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { expenses: number };
};

function toDto(row: RowWithCount): CustomCategoryDto {
  return {
    id:           row.id,
    name:         row.name,
    color:        row.color,
    description:  row.description,
    expenseCount: row._count.expenses,
    createdAt:    row.createdAt.toISOString(),
    updatedAt:    row.updatedAt.toISOString(),
  };
}
