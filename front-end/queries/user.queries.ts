/**
 * queries/user.queries.ts
 *
 * TanStack Query hooks for the /users endpoint (admin-only).
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { userService } from "@/services/user.service"
import { getApiErrorMessage } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import type {
  CreateUserDto,
  UpdateUserDto,
  ListUsersQuery,
} from "@/services/user.service"

const showToast = (opts: Parameters<typeof toast.add>[0]) => toast.add(opts)

// ── Query keys ────────────────────────────────────────────────────────────────
export const userKeys = {
  all:    ["users"] as const,
  lists:  () => [...userKeys.all, "list"] as const,
  list:   (q: ListUsersQuery) => [...userKeys.lists(), q] as const,
  detail: (id: number) => [...userKeys.all, "detail", id] as const,
}

// ── useListUsersQuery ─────────────────────────────────────────────────────────
export function useListUsersQuery(params?: ListUsersQuery) {
  return useQuery({
    queryKey: userKeys.list(params ?? {}),
    queryFn:  () => userService.getAll(params),
    staleTime: 30_000,
  })
}

// ── useCreateUserMutation ─────────────────────────────────────────────────────
export function useCreateUserMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateUserDto) => userService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() })
      showToast({
        title: "User created",
        description: "A temporary password has been set. Ask them to change it on first login.",
        type: "success",
      })
    },
    onError: (err) =>
      showToast({
        title: "Failed to create user",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

// ── useUpdateUserMutation ─────────────────────────────────────────────────────
export function useUpdateUserMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateUserDto }) =>
      userService.update(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: userKeys.lists() })
      qc.setQueryData(userKeys.detail(data.id), data)
      showToast({ title: "User updated", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to update user",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

// ── useDeleteUserMutation ─────────────────────────────────────────────────────
export function useDeleteUserMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() })
      showToast({ title: "User deleted", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to delete user",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}
