import { ReportService } from "../services/report.service.js";
const reportService = new ReportService();
export class ReportController {
    // CRUD
    async create(req, res) {
        try {
            // employeeId comes from the authenticated user, not the request body
            const dto = {
                ...req.body,
                employeeId: req.user.id,
            };
            const report = await reportService.createReport(dto);
            res.status(201).json({ success: true, data: report });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async list(req, res) {
        try {
            const filters = {
                employeeId: req.query.employeeId
                    ? parseInt(req.query.employeeId)
                    : req.user.role !== "ADMIN"
                        ? req.user.id
                        : undefined,
                ...(req.query.startDate && { startDate: req.query.startDate }),
                ...(req.query.endDate && { endDate: req.query.endDate }),
                ...(req.query.type && { type: req.query.type }),
                ...(req.query.weekNumber && { weekNumber: parseInt(req.query.weekNumber) }),
                ...(req.query.month && { month: parseInt(req.query.month) }),
                ...(req.query.year && { year: parseInt(req.query.year) }),
            };
            const reports = await reportService.listReports(filters);
            res.json({ success: true, data: reports });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const report = await reportService.getReportById(id);
            res.json({ success: true, data: report });
        }
        catch (error) {
            res.status(404).json({ success: false, message: error.message });
        }
    }
    async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            const dto = req.body;
            const report = await reportService.updateReport(id, dto);
            res.json({ success: true, data: report });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            await reportService.deleteReport(id);
            res.json({ success: true, message: "Report deleted successfully" });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    // Summaries
    async getWeeklySummary(req, res) {
        try {
            const employeeId = parseInt(req.params.employeeId);
            const year = parseInt(req.params.year);
            const weekNumber = parseInt(req.params.weekNumber);
            const summary = await reportService.getWeeklySummary(employeeId, year, weekNumber);
            res.json({ success: true, data: summary });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getMonthlySummary(req, res) {
        try {
            const employeeId = parseInt(req.params.employeeId);
            const year = parseInt(req.params.year);
            const month = parseInt(req.params.month);
            const summary = await reportService.getMonthlySummary(employeeId, year, month);
            res.json({ success: true, data: summary });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getAllEmployeesWeeklySummary(req, res) {
        try {
            const year = parseInt(req.params.year);
            const weekNumber = parseInt(req.params.weekNumber);
            const summaries = await reportService.getAllEmployeesWeeklySummary(year, weekNumber);
            res.json({ success: true, data: summaries });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getAllEmployeesMonthlySummary(req, res) {
        try {
            const year = parseInt(req.params.year);
            const month = parseInt(req.params.month);
            const summaries = await reportService.getAllEmployeesMonthlySummary(year, month);
            res.json({ success: true, data: summaries });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
//# sourceMappingURL=report.controller.js.map