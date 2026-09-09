/**
 * services/company.service.ts
 *
 * Typed wrappers around /api/v1/company endpoints.
 */

import { api } from "@/lib/api"

interface ApiEnvelope<T> {
  status: number
  data: T
}

function unwrap<T>(r: { data: ApiEnvelope<T> }): T {
  return r.data.data
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CompanySettings {
  id: number
  name: string
  tagline: string
  logoUrl: string | null
  mobile: string
  email: string
  phone: string
  website: string
  whatsapp: string
  address: string
  footerText: string
  updatedAt: string
}

export interface UpdateCompanySettingsDto {
  name?: string
  tagline?: string
  mobile?: string
  email?: string
  phone?: string
  website?: string
  whatsapp?: string
  address?: string
  footerText?: string
}

export type LogoPosition = "left" | "center" | "right"

export interface ContractTemplate {
  id: number
  name: string
  isDefault: boolean

  logoPosition: LogoPosition
  headerBg: string
  headerTextColor: string

  showMobile: boolean
  showEmail: boolean
  showPhone: boolean
  showWebsite: boolean
  showWhatsapp: boolean
  showAddress: boolean
  showTagline: boolean

  bodyBg: string
  bodyTextColor: string
  accentColor: string
  borderColor: string
  fontSizeBase: number

  showCustomerBlock: boolean
  showCostTable: boolean
  showTermsBlock: boolean
  showSignatureBlock: boolean
  showFooter: boolean

  /** Serialised TemplateLayout JSON string — null until canvas editor is used */
  layoutJson: string | null

  createdAt: string
  updatedAt: string
}

export type UpsertContractTemplateDto = Omit<
  ContractTemplate,
  "id" | "createdAt" | "updatedAt"
>

// ── Service ───────────────────────────────────────────────────────────────────

export const companyService = {
  /** GET /company/settings */
  getSettings: () =>
    api.get<ApiEnvelope<CompanySettings>>("/company/settings").then(unwrap),

  /** PATCH /company/settings */
  updateSettings: (dto: UpdateCompanySettingsDto) =>
    api.patch<ApiEnvelope<CompanySettings>>("/company/settings", dto).then(unwrap),

  /** POST /company/settings/logo */
  uploadLogo: (file: File) => {
    const form = new FormData()
    form.append("avatar", file) // backend uses the same "avatar" multer field
    return api
      .post<ApiEnvelope<CompanySettings>>("/company/settings/logo", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(unwrap)
  },

  /** DELETE /company/settings/logo */
  deleteLogo: () =>
    api.delete<ApiEnvelope<CompanySettings>>("/company/settings/logo").then(unwrap),

  /** GET /company/templates */
  getTemplates: () =>
    api.get<ApiEnvelope<ContractTemplate[]>>("/company/templates").then(unwrap),

  /** GET /company/templates/default */
  getDefaultTemplate: () =>
    api
      .get<ApiEnvelope<ContractTemplate | null>>("/company/templates/default")
      .then(unwrap),

  /** GET /company/templates/:id */
  getTemplateById: (id: number) =>
    api.get<ApiEnvelope<ContractTemplate>>(`/company/templates/${id}`).then(unwrap),

  /** POST /company/templates */
  createTemplate: (dto: UpsertContractTemplateDto) =>
    api
      .post<ApiEnvelope<ContractTemplate>>("/company/templates", dto)
      .then(unwrap),

  /** PUT /company/templates/:id */
  updateTemplate: (id: number, dto: Partial<UpsertContractTemplateDto>) =>
    api
      .put<ApiEnvelope<ContractTemplate>>(`/company/templates/${id}`, dto)
      .then(unwrap),

  /** PATCH /company/templates/:id/default */
  setDefaultTemplate: (id: number) =>
    api
      .patch<ApiEnvelope<ContractTemplate>>(`/company/templates/${id}/default`)
      .then(unwrap),

  /** PATCH /company/templates/:id/layout — saves the full canvas JSON */
  saveLayout: (id: number, layoutJson: string) =>
    api
      .patch<ApiEnvelope<ContractTemplate>>(`/company/templates/${id}/layout`, { layoutJson })
      .then(unwrap),

  /** DELETE /company/templates/:id */
  deleteTemplate: (id: number) =>
    api
      .delete<ApiEnvelope<{ success: boolean }>>(`/company/templates/${id}`)
      .then(unwrap),
}
