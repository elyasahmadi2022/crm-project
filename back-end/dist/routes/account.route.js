import { Router } from "express";
import { AccountController } from "../controllers/account.controller.js";
const router = Router();
const controller = new AccountController();
// Account CRUD
router.post("/", (req, res) => controller.create(req, res));
router.get("/", (req, res) => controller.list(req, res));
router.get("/summary", (req, res) => controller.getBalanceSummary(req, res));
router.get("/:id", (req, res) => controller.getById(req, res));
router.put("/:id", (req, res) => controller.update(req, res));
router.delete("/:id", (req, res) => controller.delete(req, res));
// Transactions
router.post("/:id/deposit", (req, res) => controller.deposit(req, res));
router.post("/:id/withdraw", (req, res) => controller.withdraw(req, res));
router.post("/transfer", (req, res) => controller.transfer(req, res));
router.get("/:id/transactions", (req, res) => controller.getTransactions(req, res));
export default router;
//# sourceMappingURL=account.route.js.map