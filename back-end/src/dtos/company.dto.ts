import { z } from 'zod';
import type { CompanySettings, ContractTemplate } from '../generated/prisma/index.js';

// ── Company Settings ──────────────────────────────────────────────────────────

export const updateCompanySettingsSchema = z.object({
  name:       z.string().optional(),
  tagline:    z.string().optional(),
  mobile:     z.string().optional(),
  email:      z.string().optional(),
  phone:      z.string().optional(),
  website:    z.string().optional(),
  whatsapp:   z.string().optional(),
  address:    z.string().optional(),
  footerText: z.string().optional(),
});
export type UpdateCompanySettingsDto = z.infer<typeof updateCompanySettingsSchema>;

export interface CompanySettingsResponseDto {
  id: number;
  name: string;
  tagline: string;
  logoUrl: string | null;
  mobile: string;
  email: string;
  phone: string;
  website: string;
  whatsapp: string;
  address: string;
  footerText: string;
  updatedAt: string;
}

export const toCompanySettingsDto = (c: CompanySettings): CompanySettingsResponseDto => ({
  id:         c.id,
  name:       c.name,
  tagline:    c.tagline,
  logoUrl:    c.logoUrl,
  mobile:     c.mobile,
  email:      c.email,
  phone:      c.phone,
  website:    c.website,
  whatsapp:   c.whatsapp,
  address:    c.address,
  footerText: c.footerText,
  updatedAt:  c.updatedAt.toISOString(),
});

// ── Contract Template ─────────────────────────────────────────────────────────

export const upsertContractTemplateSchema = z.object({
  name:             z.string().min(1, 'Template name is required.'),
  isDefault:        z.boolean().optional(),

  logoPosition:     z.enum(['left', 'center', 'right']).optional(),
  headerBg:         z.string().optional(),
  headerTextColor:  z.string().optional(),

  showMobile:   z.boolean().optional(),
  showEmail:    z.boolean().optional(),
  showPhone:    z.boolean().optional(),
  showWebsite:  z.boolean().optional(),
  showWhatsapp: z.boolean().optional(),
  showAddress:  z.boolean().optional(),
  showTagline:  z.boolean().optional(),

  bodyBg:             z.string().optional(),
  bodyTextColor:      z.string().optional(),
  accentColor:        z.string().optional(),
  borderColor:        z.string().optional(),
  fontSizeBase:       z.coerce.number().int().min(10).max(20).optional(),

  showCustomerBlock:  z.boolean().optional(),
  showCostTable:      z.boolean().optional(),
  showTermsBlock:     z.boolean().optional(),
  showSignatureBlock: z.boolean().optional(),
  showFooter:         z.boolean().optional(),

  // Canvas layout JSON — validated as a non-empty string; parsed/validated
  // further in the service layer.
  layoutJson: z.string().optional(),
});
export type UpsertContractTemplateDto = z.infer<typeof upsertContractTemplateSchema>;

export interface ContractTemplateResponseDto {
  id: number;
  name: string;
  isDefault: boolean;

  logoPosition: string;
  headerBg: string;
  headerTextColor: string;

  showMobile: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showWebsite: boolean;
  showWhatsapp: boolean;
  showAddress: boolean;
  showTagline: boolean;

  bodyBg: string;
  bodyTextColor: string;
  accentColor: string;
  borderColor: string;
  fontSizeBase: number;

  showCustomerBlock: boolean;
  showCostTable: boolean;
  showTermsBlock: boolean;
  showSignatureBlock: boolean;
  showFooter: boolean;

  /** Serialised TemplateLayout JSON — null until the user opens the canvas editor. */
  layoutJson: string | null;

  createdAt: string;
  updatedAt: string;
}

export const toContractTemplateDto = (t: ContractTemplate): ContractTemplateResponseDto => ({
  id:        t.id,
  name:      t.name,
  isDefault: t.isDefault,

  logoPosition:    t.logoPosition,
  headerBg:        t.headerBg,
  headerTextColor: t.headerTextColor,

  showMobile:   t.showMobile,
  showEmail:    t.showEmail,
  showPhone:    t.showPhone,
  showWebsite:  t.showWebsite,
  showWhatsapp: t.showWhatsapp,
  showAddress:  t.showAddress,
  showTagline:  t.showTagline,

  bodyBg:        t.bodyBg,
  bodyTextColor: t.bodyTextColor,
  accentColor:   t.accentColor,
  borderColor:   t.borderColor,
  fontSizeBase:  t.fontSizeBase,

  showCustomerBlock:  t.showCustomerBlock,
  showCostTable:      t.showCostTable,
  showTermsBlock:     t.showTermsBlock,
  showSignatureBlock: t.showSignatureBlock,
  showFooter:         t.showFooter,

  layoutJson: t.layoutJson ?? null,

  createdAt: t.createdAt.toISOString(),
  updatedAt: t.updatedAt.toISOString(),
});
