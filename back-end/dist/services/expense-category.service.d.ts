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
export interface CustomCategoryDto {
    id: number;
    name: string;
    color: string;
    description: string | null;
    expenseCount: number;
    createdAt: string;
    updatedAt: string;
}
export interface CreateCustomCategoryDto {
    name: string;
    color: string;
    description?: string | undefined;
}
export type UpdateCustomCategoryDto = {
    name?: string | undefined;
    color?: string | undefined;
    description?: string | undefined;
};
export declare const expenseCategoryService: {
    getAll(): Promise<CustomCategoryDto[]>;
    getById(id: number): Promise<CustomCategoryDto>;
    create(dto: CreateCustomCategoryDto): Promise<CustomCategoryDto>;
    update(id: number, dto: UpdateCustomCategoryDto): Promise<CustomCategoryDto>;
    delete(id: number): Promise<void>;
};
//# sourceMappingURL=expense-category.service.d.ts.map