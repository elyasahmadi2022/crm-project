"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { expenseCategoryService } from "@/services/expense-category.service"
import type { CreateCustomCategoryDto, UpdateCustomCategoryDto } from "@/services/expense-category.service"
import { getApiErrorMessage } from "@/lib/api"
import { toast } from "@/components/ui/toast"

const show = (opts: Parameters<typeof toast.add>[0]) => toast.add(opts)

export const categoryKeys = {
  all: ["expense-categories"] as const,
  detail: (id: number) => ["expense-categories", id] as const,
}

export function useExpenseCategoryConfigsQuery() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn:  expenseCategoryService.getAll,
    staleTime: 5 * 60_000,
  })
}

export function useCreateExpenseCategoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCustomCategoryDto) => expenseCategoryService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all })
      show({ title: "Category created", type: "success" })
    },
    onError: (err) =>
      show({ title: "Failed to create", description: getApiErrorMessage(err), type: "error" }),
  })
}

export function useUpdateExpenseCategoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateCustomCategoryDto }) =>
      expenseCategoryService.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all })
      show({ title: "Category updated", type: "success" })
    },
    onError: (err) =>
      show({ title: "Failed to update", description: getApiErrorMessage(err), type: "error" }),
  })
}

export function useDeleteExpenseCategoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => expenseCategoryService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all })
      show({ title: "Category deleted", type: "success" })
    },
    onError: (err) =>
      show({ title: "Failed to delete", description: getApiErrorMessage(err), type: "error" }),
  })
}
