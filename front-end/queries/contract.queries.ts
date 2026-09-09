/**
 * queries/contract.queries.ts
 *
 * TanStack Query hooks for the /contracts endpoint.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { contractService } from "@/services/contract.service"
import { getApiErrorMessage } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import type {
  CreateContractDto,
  UpdateContractDto,
  ListContractsQuery,
} from "@/services/contract.service"

const showToast = (opts: Parameters<typeof toast.add>[0]) => toast.add(opts)

// ── Query keys ────────────────────────────────────────────────────────────────
export const contractKeys = {
  all:    ["contracts"] as const,
  lists:  () => [...contractKeys.all, "list"] as const,
  list:   (q: ListContractsQuery) => [...contractKeys.lists(), q] as const,
  detail: (id: number) => [...contractKeys.all, "detail", id] as const,
}

// ── useListContractsQuery ─────────────────────────────────────────────────────
export function useListContractsQuery(params?: ListContractsQuery) {
  return useQuery({
    queryKey: contractKeys.list(params ?? {}),
    queryFn:  () => contractService.getAll(params),
    staleTime: 30_000,
  })
}

// ── useContractQuery ──────────────────────────────────────────────────────────
export function useContractQuery(id: number | null) {
  return useQuery({
    queryKey: contractKeys.detail(id!),
    queryFn:  () => contractService.getById(id!),
    enabled:  id !== null,
    staleTime: 30_000,
  })
}

// ── useCreateContractMutation ─────────────────────────────────────────────────
export function useCreateContractMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateContractDto) => contractService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contractKeys.lists() })
      showToast({ title: "Contract created", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to create contract",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

// ── useUpdateContractMutation ─────────────────────────────────────────────────
export function useUpdateContractMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateContractDto }) =>
      contractService.update(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: contractKeys.lists() })
      qc.setQueryData(contractKeys.detail(data.id), data)
      showToast({ title: "Contract updated", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to update contract",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

// ── useDeleteContractMutation ─────────────────────────────────────────────────
export function useDeleteContractMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => contractService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contractKeys.lists() })
      showToast({ title: "Contract deleted", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to delete contract",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}
