import { z } from 'zod';
import type { CompanySettings, ContractTemplate } from '../generated/prisma/index.js';
export declare const updateCompanySettingsSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    tagline: z.ZodOptional<z.ZodString>;
    mobile: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    whatsapp: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    footerText: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
export declare const toCompanySettingsDto: (c: CompanySettings) => CompanySettingsResponseDto;
export declare const upsertContractTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    isDefault: z.ZodOptional<z.ZodBoolean>;
    logoPosition: z.ZodOptional<z.ZodEnum<{
        center: "center";
        left: "left";
        right: "right";
    }>>;
    headerBg: z.ZodOptional<z.ZodString>;
    headerTextColor: z.ZodOptional<z.ZodString>;
    showMobile: z.ZodOptional<z.ZodBoolean>;
    showEmail: z.ZodOptional<z.ZodBoolean>;
    showPhone: z.ZodOptional<z.ZodBoolean>;
    showWebsite: z.ZodOptional<z.ZodBoolean>;
    showWhatsapp: z.ZodOptional<z.ZodBoolean>;
    showAddress: z.ZodOptional<z.ZodBoolean>;
    showTagline: z.ZodOptional<z.ZodBoolean>;
    bodyBg: z.ZodOptional<z.ZodString>;
    bodyTextColor: z.ZodOptional<z.ZodString>;
    accentColor: z.ZodOptional<z.ZodString>;
    borderColor: z.ZodOptional<z.ZodString>;
    fontSizeBase: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    showCustomerBlock: z.ZodOptional<z.ZodBoolean>;
    showCostTable: z.ZodOptional<z.ZodBoolean>;
    showTermsBlock: z.ZodOptional<z.ZodBoolean>;
    showSignatureBlock: z.ZodOptional<z.ZodBoolean>;
    showFooter: z.ZodOptional<z.ZodBoolean>;
    layoutJson: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
export declare const toContractTemplateDto: (t: ContractTemplate) => ContractTemplateResponseDto;
//# sourceMappingURL=company.dto.d.ts.map