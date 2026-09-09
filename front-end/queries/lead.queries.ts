/**
 * queries/lead.queries.ts
 *
 * TanStack Query hooks for the /leads endpoint.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { leadService } from "@/services/lead.service"
import { getApiErrorMessage } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import type {
  CreateLeadDto,
  UpdateLeadDto,
  ChangeLeadStatusDto,
  AddLeadNoteDto,
  ListLeadsQuery,
} from "@/services/lead.service"

const showToast = (opts: Parameters<typeof toast.add>[0]) => toast.add(opts)

// ── Query keys ────────────────────────────────────────────────────────────────
export const leadKeys = {
  all:    ["leads"] as const,
  lists:  () => [...leadKeys.all, "list"] as const,
  list:   (q: ListLeadsQuery) => [...leadKeys.lists(), q] as const,
  detail: (id: number) => [...leadKeys.all, "detail", id] as const,
}

// ── useListLeadsQuery ─────────────────────────────────────────────────────────
export function useListLeadsQuery(params?: ListLeadsQuery) {
  return useQuery({
    queryKey: leadKeys.list(params ?? {}),
    queryFn:  () => leadService.getAll(params),
    staleTime: 30_000,
  })
}

// ── useLeadQuery ──────────────────────────────────────────────────────────────
export function useLeadQuery(id: number | null) {
  return useQuery({
    queryKey: leadKeys.detail(id!),
    queryFn:  () => leadService.getById(id!),
    enabled:  id !== null,
    staleTime: 30_000,
  })
}

// ── useCreateLeadMutation ─────────────────────────────────────────────────────
export function useCreateLeadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateLeadDto) => leadService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadKeys.lists() })
      showToast({ title: "Lead created", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to create lead",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

// ── useUpdateLeadMutation ─────────────────────────────────────────────────────
export function useUpdateLeadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateLeadDto }) =>
      leadService.update(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: leadKeys.lists() })
      qc.setQueryData(leadKeys.detail(data.id), data)
      showToast({ title: "Lead updated", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to update lead",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

// ── useChangeLeadStatusMutation ───────────────────────────────────────────────
export function useChangeLeadStatusMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ChangeLeadStatusDto }) =>
      leadService.changeStatus(id, dto),
    onSuccess: (data) => {
      // Invalidate all lead queries so every list + the allWaLeads effect re-fetches
      qc.invalidateQueries({ queryKey: leadKeys.all })
      qc.setQueryData(leadKeys.detail(data.id), data)
      showToast({ title: "Lead status updated", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to change status",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

// ── useAddLeadNoteMutation ────────────────────────────────────────────────────
export function useAddLeadNoteMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: AddLeadNoteDto }) =>
      leadService.addNote(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: leadKeys.detail(data.id) })
      showToast({ title: "Note added", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to add note",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

// ── useConvertLeadMutation ────────────────────────────────────────────────────
export function useConvertLeadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => leadService.convertToCustomer(id),
    onSuccess: (data) => {
      // Remove this lead from all list caches (it's now a customer)
      qc.invalidateQueries({ queryKey: leadKeys.all })
      qc.setQueryData(leadKeys.detail(data.id), data)
      // Also refresh customers list so the new customer appears immediately
      qc.invalidateQueries({ queryKey: ["customers"] })
      showToast({
        title: "Lead converted to customer",
        description: `${data.name} has been added to your customers list.`,
        type: "success",
      })
    },
    onError: (err) =>
      showToast({
        title: "Failed to convert lead",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

// ── useDeleteLeadMutation ─────────────────────────────────────────────────────
export function useDeleteLeadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => leadService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadKeys.lists() })
      showToast({ title: "Lead deleted", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to delete lead",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}
