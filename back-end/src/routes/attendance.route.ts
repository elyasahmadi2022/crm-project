import { Router } from "express"
import { AttendanceController } from "../controllers/attendance.controller.js"
import { authenticate } from "../middleware/auth.meddleware.js"

const router = Router()
const controller = new AttendanceController()

// Public routes (no auth required)
router.post("/public/verify-face", (req, res) => controller.publicVerifyFace(req, res))
router.post("/public/checkin",     (req, res) => controller.publicCheckIn(req, res))
router.post("/public/checkout",    (req, res) => controller.publicCheckOut(req, res))

// Face Recognition
router.post("/face/register", authenticate, (req, res) => controller.registerFace(req, res))
router.post("/face/verify",   authenticate, (req, res) => controller.verifyFace(req, res))

// Check In/Out
router.post("/checkin",  authenticate, (req, res) => controller.checkIn(req, res))
router.post("/checkout", authenticate, (req, res) => controller.checkOut(req, res))

// Manual Attendance (Admin)
router.post("/manual", authenticate, (req, res) => controller.createManual(req, res))
router.put("/:id",     authenticate, (req, res) => controller.update(req, res))
router.delete("/:id",  authenticate, (req, res) => controller.delete(req, res))

// Query
router.get("/today",                                     authenticate, (req, res) => controller.getToday(req, res))
router.get("/date/:date",                                authenticate, (req, res) => controller.getByDate(req, res))
router.get("/employee/:employeeId",                      authenticate, (req, res) => controller.getEmployeeAttendance(req, res))
router.get("/employee/:employeeId/monthly/:year/:month", authenticate, (req, res) => controller.getMonthlyAttendance(req, res))

export default router
