import { api } from "@/lib/api"

export interface Account {
  id: number
  name: string
  type: string
  balance: number
  currency: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AccountTransaction {
  id: number
  accountId: number
  type: string
  amount: number
  description: string | null
  reference: string | null
  createdAt: string
  account?: Account
}

export interface CreateAccountDto {
  name: string
  type: string
  balance: number
  currency: string
  description?: string
}

export interface CreateTransactionDto {
  accountId: number
  type: string
  amount: number
  description?: string
  reference?: string
}

export const accountService = {
  // Accounts
  getAllAccounts: async (): Promise<Account[]> => {
    const response = await api.get("/accounts")
    return response.data.data || response.data
  },

  getAccountById: async (id: number): Promise<Account> => {
    const response = await api.get(`/accounts/${id}`)
    return response.data.data || response.data
  },

  createAccount: async (data: CreateAccountDto): Promise<Account> => {
    const response = await api.post("/accounts", data)
    return response.data.data || response.data
  },

  updateAccount: async (id: number, data: Partial<CreateAccountDto>): Promise<Account> => {
    const response = await api.put(`/accounts/${id}`, data)
    return response.data.data || response.data
  },

  deleteAccount: async (id: number): Promise<void> => {
    await api.delete(`/accounts/${id}`)
  },

  // Transactions
  getAccountTransactions: async (accountId: number): Promise<AccountTransaction[]> => {
    const response = await api.get(`/accounts/${accountId}/transactions`)
    return response.data.data || response.data
  },

  createTransaction: async (data: CreateTransactionDto): Promise<AccountTransaction> => {
    const response = await api.post("/accounts/transactions", data)
    return response.data.data || response.data
  },

  getAccountBalance: async (accountId: number): Promise<number> => {
    const response = await api.get(`/accounts/${accountId}/balance`)
    return response.data.data?.balance || response.data.balance
  },
}
