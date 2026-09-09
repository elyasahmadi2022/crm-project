import { Router } from "express"
import { PayrollController } from "../controllers/payroll.controller.js"

const router = Router()
const controller = new PayrollController()

// Payroll CRUD
router.post("/", (req, res) => controller.create(req, res))
router.get("/", (req, res) => controller.list(req, res))
router.get("/:id", (req, res) => controller.getById(req, res))
router.put("/:id", (req, res) => controller.update(req, res))
router.delete("/:id", (req, res) => controller.delete(req, res))
router.post("/:id/pay", (req, res) => controller.pay(req, res))

// Advances
router.post("/advances", (req, res) => controller.recordAdvance(req, res))
router.get("/advances", (req, res) => controller.listAdvances(req, res))
router.get("/advances/:id", (req, res) => controller.getAdvanceById(req, res))
router.post("/advances/deduct", (req, res) => controller.deductAdvance(req, res))

// Bulk & Reports
router.post("/generate", (req, res) => controller.generateMonthly(req, res))
router.get("/report/:year/:month", (req, res) => controller.getMonthlyReport(req, res))
router.get("/employee/:employeeId/history", (req, res) => controller.getEmployeeHistory(req, res))

export default router
