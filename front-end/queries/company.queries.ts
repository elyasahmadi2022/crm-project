"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { companyService } from "@/services/company.service"
import { getApiErrorMessage } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import type {
  UpdateCompanySettingsDto,
  UpsertContractTemplateDto,
} from "@/services/company.service"

const showToast = (opts: Parameters<typeof toast.add>[0]) => toast.add(opts)

// ── Keys ──────────────────────────────────────────────────────────────────────
export const companyKeys = {
  settings:          ["company", "settings"] as const,
  templates:         ["company", "templates"] as const,
  defaultTemplate:   ["company", "templates", "default"] as const,
  template: (id: number) => ["company", "templates", id] as const,
}

// ── Company Settings ──────────────────────────────────────────────────────────

export function useCompanySettingsQuery() {
  return useQuery({
    queryKey: companyKeys.settings,
    queryFn:  companyService.getSettings,
    staleTime: 60_000,
  })
}

export function useUpdateCompanySettingsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateCompanySettingsDto) =>
      companyService.updateSettings(dto),
    onSuccess: (data) => {
      qc.setQueryData(companyKeys.settings, data)
      showToast({ title: "Company settings saved", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to save settings",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

export function useUploadLogoMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => companyService.uploadLogo(file),
    onSuccess: (data) => {
      qc.setQueryData(companyKeys.settings, data)
      showToast({ title: "Logo uploaded", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to upload logo",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

export function useDeleteLogoMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: companyService.deleteLogo,
    onSuccess: (data) => {
      qc.setQueryData(companyKeys.settings, data)
      showToast({ title: "Logo removed", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to remove logo",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

// ── Contract Templates ────────────────────────────────────────────────────────

export function useContractTemplatesQuery() {
  return useQuery({
    queryKey: companyKeys.templates,
    queryFn:  companyService.getTemplates,
    staleTime: 60_000,
  })
}

export function useDefaultTemplateQuery() {
  return useQuery({
    queryKey: companyKeys.defaultTemplate,
    queryFn:  companyService.getDefaultTemplate,
    staleTime: 60_000,
  })
}

export function useCreateTemplateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpsertContractTemplateDto) =>
      companyService.createTemplate(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: companyKeys.templates })
      qc.invalidateQueries({ queryKey: companyKeys.defaultTemplate })
      showToast({ title: "Template created", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to create template",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

export function useUpdateTemplateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<UpsertContractTemplateDto> }) =>
      companyService.updateTemplate(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: companyKeys.templates })
      qc.invalidateQueries({ queryKey: companyKeys.defaultTemplate })
      qc.setQueryData(companyKeys.template(data.id), data)
      showToast({ title: "Template saved", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to save template",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

export function useSetDefaultTemplateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => companyService.setDefaultTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: companyKeys.templates })
      qc.invalidateQueries({ queryKey: companyKeys.defaultTemplate })
      showToast({ title: "Default template updated", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to set default",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

export function useDeleteTemplateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => companyService.deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: companyKeys.templates })
      qc.invalidateQueries({ queryKey: companyKeys.defaultTemplate })
      showToast({ title: "Template deleted", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to delete template",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}

// ── useSaveLayoutMutation ─────────────────────────────────────────────────────
// Saves the full canvas JSON blob for a template.
// Called from the canvas editor on every explicit Save action.

export function useSaveLayoutMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, layoutJson }: { id: number; layoutJson: string }) =>
      companyService.saveLayout(id, layoutJson),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: companyKeys.templates })
      qc.setQueryData(companyKeys.template(data.id), data)
      showToast({ title: "Layout saved", type: "success" })
    },
    onError: (err) =>
      showToast({
        title: "Failed to save layout",
        description: getApiErrorMessage(err),
        type: "error",
      }),
  })
}
