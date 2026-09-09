import { AccountService } from "../services/account.service.js";
const accountService = new AccountService();
export class AccountController {
    // Create account
    async create(req, res) {
        try {
            const dto = req.body;
            const account = await accountService.createAccount(dto);
            res.status(201).json({ success: true, data: account });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    // List all accounts
    async list(req, res) {
        try {
            const isActive = req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined;
            const accounts = await accountService.listAccounts(isActive);
            res.json({ success: true, data: accounts });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Get account by ID
    async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const account = await accountService.getAccountById(id);
            res.json({ success: true, data: account });
        }
        catch (error) {
            res.status(404).json({ success: false, message: error.message });
        }
    }
    // Update account
    async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            const dto = req.body;
            const account = await accountService.updateAccount(id, dto);
            res.json({ success: true, data: account });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    // Delete account
    async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            await accountService.deleteAccount(id);
            res.json({ success: true, message: "Account deleted successfully" });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    // Deposit money
    async deposit(req, res) {
        try {
            const id = parseInt(req.params.id);
            const dto = req.body;
            const transaction = await accountService.deposit(id, dto);
            res.json({ success: true, data: transaction });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    // Withdraw money
    async withdraw(req, res) {
        try {
            const id = parseInt(req.params.id);
            const dto = req.body;
            const transaction = await accountService.withdraw(id, dto);
            res.json({ success: true, data: transaction });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    // Transfer between accounts
    async transfer(req, res) {
        try {
            const dto = req.body;
            const result = await accountService.transfer(dto);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    // Get transactions
    async getTransactions(req, res) {
        try {
            const id = parseInt(req.params.id);
            const limit = req.query.limit ? parseInt(req.query.limit) : 100;
            const transactions = await accountService.getTransactions(id, limit);
            res.json({ success: true, data: transactions });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Get balance summary
    async getBalanceSummary(req, res) {
        try {
            const summary = await accountService.getBalanceSummary();
            res.json({ success: true, data: summary });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
//# sourceMappingURL=account.controller.js.map