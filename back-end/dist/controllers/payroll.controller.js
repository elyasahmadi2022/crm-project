import { PayrollService } from "../services/payroll.service.js";
const payrollService = new PayrollService();
export class PayrollController {
    // ────────────────────────────────────────────────────────────────────
    // Payroll CRUD
    // ────────────────────────────────────────────────────────────────────
    async create(req, res) {
        try {
            const dto = req.body;
            const payroll = await payrollService.createPayroll(dto);
            res.status(201).json({ success: true, data: payroll });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async list(req, res) {
        try {
            const filters = {
                month: req.query.month ? parseInt(req.query.month) : undefined,
                year: req.query.year ? parseInt(req.query.year) : undefined,
                employeeId: req.query.employeeId ? parseInt(req.query.employeeId) : undefined,
                status: req.query.status,
            };
            const payrolls = await payrollService.listPayrolls(filters);
            res.json({ success: true, data: payrolls });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const payroll = await payrollService.getPayrollById(id);
            res.json({ success: true, data: payroll });
        }
        catch (error) {
            res.status(404).json({ success: false, message: error.message });
        }
    }
    async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            const dto = req.body;
            const payroll = await payrollService.updatePayroll(id, dto);
            res.json({ success: true, data: payroll });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            await payrollService.deletePayroll(id);
            res.json({ success: true, message: "Payroll deleted successfully" });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async pay(req, res) {
        try {
            const id = parseInt(req.params.id);
            const dto = req.body;
            const payroll = await payrollService.payPayroll(id, dto);
            res.json({ success: true, data: payroll });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    // ────────────────────────────────────────────────────────────────────
    // Advances
    // ────────────────────────────────────────────────────────────────────
    async recordAdvance(req, res) {
        try {
            const dto = req.body;
            const advance = await payrollService.recordAdvance(dto);
            res.status(201).json({ success: true, data: advance });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async listAdvances(req, res) {
        try {
            const employeeId = req.query.employeeId ? parseInt(req.query.employeeId) : undefined;
            const advances = await payrollService.listAdvances(employeeId);
            res.json({ success: true, data: advances });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getAdvanceById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const advance = await payrollService.getAdvanceById(id);
            res.json({ success: true, data: advance });
        }
        catch (error) {
            res.status(404).json({ success: false, message: error.message });
        }
    }
    async deductAdvance(req, res) {
        try {
            const dto = req.body;
            const advance = await payrollService.deductAdvance(dto);
            res.json({ success: true, data: advance });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    // ────────────────────────────────────────────────────────────────────
    // Bulk & Reports
    // ────────────────────────────────────────────────────────────────────
    async generateMonthly(req, res) {
        try {
            const dto = req.body;
            const payrolls = await payrollService.generateMonthlyPayroll(dto);
            res.status(201).json({ success: true, data: payrolls });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async getMonthlyReport(req, res) {
        try {
            const month = parseInt(req.params.month);
            const year = parseInt(req.params.year);
            const report = await payrollService.getMonthlyReport(month, year);
            res.json({ success: true, data: report });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getEmployeeHistory(req, res) {
        try {
            const employeeId = parseInt(req.params.employeeId);
            const limit = req.query.limit ? parseInt(req.query.limit) : 12;
            const history = await payrollService.getEmployeePayrollHistory(employeeId, limit);
            res.json({ success: true, data: history });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
//# sourceMappingURL=payroll.controller.js.map