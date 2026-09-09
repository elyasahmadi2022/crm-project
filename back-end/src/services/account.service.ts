import { AccountType, TransactionType } from "../generated/prisma"
import { prisma } from "../lib/primsa.js"
import type {
  CreateAccountDto,
  UpdateAccountDto,
  AccountTransactionDto,
  TransferDto,
} from "../dtos/account.dto.js"

export class AccountService {
  // ────────────────────────────────────────────────────────────────────
  // Account Management
  // ────────────────────────────────────────────────────────────────────

  async createAccount(dto: CreateAccountDto) {
    return prisma.account.create({
      data: {
        name: dto.name,
        type: dto.type,
        balance: dto.balance || 0,
        currency: dto.currency || "USD",
        description: dto.description,
      },
    })
  }

  async listAccounts(isActive?: boolean) {
    return prisma.account.findMany({
      where: isActive !== undefined ? { isActive } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    })
  }

  async getAccountById(id: number) {
    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { transactionDate: "desc" },
          take: 50, // Last 50 transactions
        },
      },
    })

    if (!account) {
      throw new Error("Account not found")
    }

    return account
  }

  async updateAccount(id: number, dto: UpdateAccountDto) {
    return prisma.account.update({
      where: { id },
      data: dto,
    })
  }

  async deleteAccount(id: number) {
    // Check if account has transactions
    const count = await prisma.accountTransaction.count({
      where: { accountId: id },
    })

    if (count > 0) {
      throw new Error(
        "Cannot delete account with transactions. Consider deactivating instead."
      )
    }

    return prisma.account.delete({
      where: { id },
    })
  }

  // ────────────────────────────────────────────────────────────────────
  // Transactions
  // ────────────────────────────────────────────────────────────────────

  async deposit(accountId: number, dto: AccountTransactionDto) {
    return prisma.$transaction(async (tx) => {
      // Get current account
      const account = await tx.account.findUnique({
        where: { id: accountId },
      })

      if (!account) {
        throw new Error("Account not found")
      }

      // Calculate new balance
      const newBalance = Number(account.balance) + dto.amount

      // Update account balance
      await tx.account.update({
        where: { id: accountId },
        data: { balance: newBalance },
      })

      // Create transaction record
      return tx.accountTransaction.create({
        data: {
          accountId,
          type: TransactionType.CREDIT,
          amount: dto.amount,
          balanceAfter: newBalance,
          description: dto.description,
          reference: dto.reference,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
        },
        include: {
          account: true,
        },
      })
    })
  }

  async withdraw(accountId: number, dto: AccountTransactionDto) {
    return prisma.$transaction(async (tx) => {
      // Get current account
      const account = await tx.account.findUnique({
        where: { id: accountId },
      })

      if (!account) {
        throw new Error("Account not found")
      }

      // Calculate new balance
      const newBalance = Number(account.balance) - dto.amount

      if (newBalance < 0) {
        throw new Error("Insufficient funds")
      }

      // Update account balance
      await tx.account.update({
        where: { id: accountId },
        data: { balance: newBalance },
      })

      // Create transaction record
      return tx.accountTransaction.create({
        data: {
          accountId,
          type: TransactionType.DEBIT,
          amount: dto.amount,
          balanceAfter: newBalance,
          description: dto.description,
          reference: dto.reference,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
        },
        include: {
          account: true,
        },
      })
    })
  }

  async transfer(dto: TransferDto) {
    return prisma.$transaction(async (tx) => {
      // Get both accounts
      const [fromAccount, toAccount] = await Promise.all([
        tx.account.findUnique({ where: { id: dto.fromAccountId } }),
        tx.account.findUnique({ where: { id: dto.toAccountId } }),
      ])

      if (!fromAccount || !toAccount) {
        throw new Error("One or both accounts not found")
      }

      if (fromAccount.currency !== toAccount.currency) {
        throw new Error("Transfers must use accounts with the same currency")
      }

      // Calculate new balances
      const newFromBalance = Number(fromAccount.balance) - dto.amount
      const newToBalance = Number(toAccount.balance) + dto.amount

      if (newFromBalance < 0) {
        throw new Error("Insufficient funds in source account")
      }

      // Update both accounts
      await Promise.all([
        tx.account.update({
          where: { id: dto.fromAccountId },
          data: { balance: newFromBalance },
        }),
        tx.account.update({
          where: { id: dto.toAccountId },
          data: { balance: newToBalance },
        }),
      ])

      // Create transaction records
      const [debitTx, creditTx] = await Promise.all([
        tx.accountTransaction.create({
          data: {
            accountId: dto.fromAccountId,
            type: TransactionType.TRANSFER,
            amount: dto.amount,
            balanceAfter: newFromBalance,
            description: dto.description || `Transfer to ${toAccount.name}`,
            reference: dto.reference,
            referenceType: "transfer",
            referenceId: dto.toAccountId,
          },
        }),
        tx.accountTransaction.create({
          data: {
            accountId: dto.toAccountId,
            type: TransactionType.TRANSFER,
            amount: dto.amount,
            balanceAfter: newToBalance,
            description: dto.description || `Transfer from ${fromAccount.name}`,
            reference: dto.reference,
            referenceType: "transfer",
            referenceId: dto.fromAccountId,
          },
        }),
      ])

      return { debitTx, creditTx }
    })
  }

  async getTransactions(accountId: number, limit = 100) {
    return prisma.accountTransaction.findMany({
      where: { accountId },
      orderBy: { transactionDate: "desc" },
      take: limit,
      include: {
        account: true,
      },
    })
  }

  // Get account balance summary
  async getBalanceSummary() {
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
    })

    const byCurrency = accounts.reduce((acc, account) => {
      const currency = account.currency
      if (!acc[currency]) acc[currency] = 0
      acc[currency] += Number(account.balance)
      return acc
    }, {} as Record<string, number>)

    return {
      byCurrency,
      accounts: accounts.map((acc) => ({
        id: acc.id,
        name: acc.name,
        type: acc.type,
        balance: Number(acc.balance),
        currency: acc.currency,
      })),
    }
  }
}
