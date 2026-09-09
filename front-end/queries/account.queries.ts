import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { accountService, type CreateAccountDto, type CreateTransactionDto } from "@/services/account.service"
import { toast } from "@/lib/toast"

export const useAccounts = () => {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: accountService.getAllAccounts,
  })
}

export const useAccount = (id: number) => {
  return useQuery({
    queryKey: ["accounts", id],
    queryFn: () => accountService.getAccountById(id),
    enabled: !!id,
  })
}

export const useAccountTransactions = (accountId: number) => {
  return useQuery({
    queryKey: ["accounts", accountId, "transactions"],
    queryFn: () => accountService.getAccountTransactions(accountId),
    enabled: !!accountId,
  })
}

export const useCreateAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAccountDto) => accountService.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Account created successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create account")
    },
  })
}

export const useUpdateAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateAccountDto> }) =>
      accountService.updateAccount(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["accounts", variables.id] })
      toast.success("Account updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update account")
    },
  })
}

export const useDeleteAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => accountService.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Account deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete account")
    },
  })
}

export const useCreateTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTransactionDto) => accountService.createTransaction(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["accounts", variables.accountId] })
      queryClient.invalidateQueries({ queryKey: ["accounts", variables.accountId, "transactions"] })
      toast.success("Transaction created successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create transaction")
    },
  })
}
