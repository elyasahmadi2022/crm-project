import { Router } from "express";
import { UserRole } from "../generated/prisma/index.js";
import { asyncHandler } from "../utiles/error-handler.utiles.js";
import { authenticate, authorize } from "../middleware/auth.meddleware.js";
import { financeController } from "../controllers/finance.controller.js";

const router = Router();

// Invoices
router.get("/invoices", authenticate, asyncHandler(financeController.getAllInvoices));
router.get("/invoices/:id", authenticate, asyncHandler(financeController.getInvoiceById));
router.post("/invoices", authenticate, authorize(UserRole.ADMIN, UserRole.FINANCE), asyncHandler(financeController.createInvoice));
router.put("/invoices/:id", authenticate, authorize(UserRole.ADMIN, UserRole.FINANCE), asyncHandler(financeController.updateInvoice));
router.patch("/invoices/:id/status", authenticate, authorize(UserRole.ADMIN, UserRole.FINANCE), asyncHandler(financeController.changeInvoiceStatus));
router.post("/invoices/:id/payments", authenticate, authorize(UserRole.ADMIN, UserRole.FINANCE), asyncHandler(financeController.addPayment));

// Budgets
router.get("/budgets", authenticate, asyncHandler(financeController.getAllBudgets));
router.get("/budgets/:id", authenticate, asyncHandler(financeController.getBudgetById));
router.post("/budgets", authenticate, authorize(UserRole.ADMIN, UserRole.FINANCE), asyncHandler(financeController.createBudget));
router.put("/budgets/:id", authenticate, authorize(UserRole.ADMIN, UserRole.FINANCE), asyncHandler(financeController.updateBudget));

// Expenses
router.get("/expenses", authenticate, asyncHandler(financeController.getAllExpenses));
router.get("/expenses/:id", authenticate, asyncHandler(financeController.getExpenseById));
router.post("/expenses", authenticate, authorize(UserRole.ADMIN, UserRole.FINANCE), asyncHandler(financeController.createExpense));
router.put("/expenses/:id", authenticate, authorize(UserRole.ADMIN, UserRole.FINANCE), asyncHandler(financeController.updateExpense));

export { router as financeRouter };
