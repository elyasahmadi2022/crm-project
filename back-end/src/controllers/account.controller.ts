import type { Request, Response } from "express"
import { AccountService } from "../services/account.service.js"
import type {
  CreateAccountDto,
  UpdateAccountDto,
  AccountTransactionDto,
  TransferDto,
} from "../dtos/account.dto.js"

const accountService = new AccountService()

export class AccountController {
  // Create account
  async create(req: Request, res: Response) {
    try {
      const dto = req.body as CreateAccountDto
      const account = await accountService.createAccount(dto)
      res.status(201).json({ success: true, data: account })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  // List all accounts
  async list(req: Request, res: Response) {
    try {
      const isActive = req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined
      const accounts = await accountService.listAccounts(isActive)
      res.json({ success: true, data: accounts })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message })
    }
  }

  // Get account by ID
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      const account = await accountService.getAccountById(id)
      res.json({ success: true, data: account })
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message })
    }
  }

  // Update account
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      const dto = req.body as UpdateAccountDto
      const account = await accountService.updateAccount(id, dto)
      res.json({ success: true, data: account })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  // Delete account
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      await accountService.deleteAccount(id)
      res.json({ success: true, message: "Account deleted successfully" })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  // Deposit money
  async deposit(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      const dto = req.body as AccountTransactionDto
      const transaction = await accountService.deposit(id, dto)
      res.json({ success: true, data: transaction })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  // Withdraw money
  async withdraw(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      const dto = req.body as AccountTransactionDto
      const transaction = await accountService.withdraw(id, dto)
      res.json({ success: true, data: transaction })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  // Transfer between accounts
  async transfer(req: Request, res: Response) {
    try {
      const dto = req.body as TransferDto
      const result = await accountService.transfer(dto)
      res.json({ success: true, data: result })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  // Get transactions
  async getTransactions(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100
      const transactions = await accountService.getTransactions(id, limit)
      res.json({ success: true, data: transactions })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message })
    }
  }

  // Get balance summary
  async getBalanceSummary(req: Request, res: Response) {
    try {
      const summary = await accountService.getBalanceSummary()
      res.json({ success: true, data: summary })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
}
