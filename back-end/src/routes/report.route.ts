import { Router } from "express"
import { ReportController } from "../controllers/report.controller.js"
import { authenticate } from "../middleware/auth.meddleware.js"
import { asyncHandler } from "../utiles/error-handler.utiles.js"

const router = Router()
const controller = new ReportController()

// All report routes require authentication
router.post("/", authenticate, (req, res) => controller.create(req, res))
router.get("/", authenticate, (req, res) => controller.list(req, res))
router.get("/:id", authenticate, (req, res) => controller.getById(req, res))
router.put("/:id", authenticate, (req, res) => controller.update(req, res))
router.delete("/:id", authenticate, (req, res) => controller.delete(req, res))

// Summaries — employee specific
router.get("/employee/:employeeId/weekly/:year/:weekNumber", authenticate, (req, res) =>
  controller.getWeeklySummary(req, res)
)
router.get("/employee/:employeeId/monthly/:year/:month", authenticate, (req, res) =>
  controller.getMonthlySummary(req, res)
)

// Summaries — all employees (admin)
router.get("/summary/weekly/:year/:weekNumber", authenticate, (req, res) =>
  controller.getAllEmployeesWeeklySummary(req, res)
)
router.get("/summary/monthly/:year/:month", authenticate, (req, res) =>
  controller.getAllEmployeesMonthlySummary(req, res)
)

export default router
