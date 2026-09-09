/**
 * queries/customer.queries.ts
 *
 * TanStack Query hooks for the /customers endpoint.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { customerService } from "@/services/customer.service"
import { getApiErrorMessage } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import type {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateContactDto,
  UpdateContactDto,
  ListCustomersQuery,
} from "@/services/customer.service"

const showToast = (opts: Parameters<typeof toast.add>[0]) => toast.add(opts)

// ── Query keys ────────────────────────────────────────────────────────────────
export const customerKeys = {
  all:    ["customers"] as const,
  lists:  () => [...customerKeys.all, "list"] as const,
  list:   (q: ListCustomersQuery) => [...customerKeys.lists(), q] as const,
  detail: (id: number) => [...customerKeys.all, "detail", id] as const,
}

// ── useListCustomersQuery ─────────────────────────────────────────────────────
export function useListCustomersQuery(params?: ListCustomersQuery) {
  return useQuery({
    queryKey: customerKeys.list(params ?? {}),
    queryFn:  () => customerService.getAll(params),
    staleTime: 30_000,
  })
}

// ── useCustomerQuery ──────────────────────────────────────────────────────────
export function useCustomerQuery(id: number | null) {
  return useQuery({
    queryKey: customerKeys.detail(id!),
    queryFn:  () => customerService.getById(id!),
    enabled:  id !== null,
    staleTime: 30_000,
  })
}

// ── useCreateCustomerMutation ─────────────────────────────────────────────────
export function useCreateCustomerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCustomerDto) => customerService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() })
      showToast({ title: "Customer created", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to create customer",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

// ── useUpdateCustomerMutation ─────────────────────────────────────────────────
export function useUpdateCustomerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateCustomerDto }) =>
      customerService.update(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() })
      qc.setQueryData(customerKeys.detail(data.id), data)
      showToast({ title: "Customer updated", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to update customer",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

// ── useDeleteCustomerMutation ─────────────────────────────────────────────────
export function useDeleteCustomerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => customerService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() })
      showToast({ title: "Customer deleted", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to delete customer",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

// ── useAddContactMutation ─────────────────────────────────────────────────────
export function useAddContactMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      customerId,
      dto,
    }: {
      customerId: number
      dto: CreateContactDto
    }) => customerService.addContact(customerId, dto),
    onSuccess: (_data, { customerId }) => {
      qc.invalidateQueries({ queryKey: customerKeys.detail(customerId) })
      qc.invalidateQueries({ queryKey: customerKeys.lists() })
      showToast({ title: "Contact added", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to add contact",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

// ── useUpdateContactMutation ──────────────────────────────────────────────────
export function useUpdateContactMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      contactId,
      dto,
    }: {
      contactId: number
      dto: UpdateContactDto
    }) => customerService.updateContact(contactId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() })
      showToast({ title: "Contact updated", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to update contact",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

// ── useDeleteContactMutation ──────────────────────────────────────────────────
export function useDeleteContactMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (contactId: number) => customerService.deleteContact(contactId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() })
      showToast({ title: "Contact removed", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to remove contact",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}
