import {
  toCompanySettingsDto,
  toContractTemplateDto,
  type UpdateCompanySettingsDto,
  type UpsertContractTemplateDto,
  type CompanySettingsResponseDto,
  type ContractTemplateResponseDto,
} from '../dtos/company.dto.js';
import { Prisma } from '../generated/prisma/index.js';
import { companyRepository, contractTemplateRepository } from '../repositories/company.repository.js';
import { AppError } from '../utiles/error-handler.utiles.js';

// Inline blank-layout seed so the backend doesn't import front-end types.
// Shape mirrors TemplateLayout from canvas-types.ts — version "1".
function makeBlankLayoutJson(): string {
  return JSON.stringify({ version: '1', page: { preset: 'A4', orientation: 'portrait', widthPx: 794, heightPx: 1123, widthMm: 210, heightMm: 297, background: '#ffffff', backgroundImage: null, backgroundImageOpacity: 100 }, elements: [] });
}

// ── Company Settings ──────────────────────────────────────────────────────────

export const companyService = {
  async get(): Promise<CompanySettingsResponseDto> {
    const settings = await companyRepository.get();
    return toCompanySettingsDto(settings);
  },

  async update(dto: UpdateCompanySettingsDto): Promise<CompanySettingsResponseDto> {
    // Strip undefined keys so exactOptionalPropertyTypes doesn't reject them
    const data = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    ) as Prisma.CompanySettingsUpdateInput;
    const updated = await companyRepository.update(data);
    return toCompanySettingsDto(updated);
  },

  async updateLogo(logoUrl: string | null): Promise<CompanySettingsResponseDto> {
    const updated = await companyRepository.updateLogo(logoUrl);
    return toCompanySettingsDto(updated);
  },
};

// ── Contract Templates ────────────────────────────────────────────────────────

export const contractTemplateService = {
  async getAll(): Promise<ContractTemplateResponseDto[]> {
    const templates = await contractTemplateRepository.findAll();
    return templates.map(toContractTemplateDto);
  },

  async getById(id: number): Promise<ContractTemplateResponseDto> {
    const t = await contractTemplateRepository.findById(id);
    if (!t) throw new AppError(404, 'Contract template not found.');
    return toContractTemplateDto(t);
  },

  async getDefault(): Promise<ContractTemplateResponseDto | null> {
    const t = await contractTemplateRepository.findDefault();
    return t ? toContractTemplateDto(t) : null;
  },

  async create(dto: UpsertContractTemplateDto): Promise<ContractTemplateResponseDto> {
    // If this is the first template or marked default, clear others first
    if (dto.isDefault) {
      await contractTemplateRepository.findAll().then(async (all) => {
        if (all.length > 0) {
          for (const t of all) {
            await contractTemplateRepository.update(t.id, { isDefault: false });
          }
        }
      });
    }
    const created = await contractTemplateRepository.create({
      name:             dto.name,
      isDefault:        dto.isDefault ?? false,
      logoPosition:     dto.logoPosition    ?? 'left',
      headerBg:         dto.headerBg        ?? '#ffffff',
      headerTextColor:  dto.headerTextColor ?? '#111111',
      showMobile:       dto.showMobile      ?? true,
      showEmail:        dto.showEmail       ?? true,
      showPhone:        dto.showPhone       ?? true,
      showWebsite:      dto.showWebsite     ?? true,
      showWhatsapp:     dto.showWhatsapp    ?? true,
      showAddress:      dto.showAddress     ?? true,
      showTagline:      dto.showTagline     ?? true,
      bodyBg:            dto.bodyBg            ?? '#ffffff',
      bodyTextColor:     dto.bodyTextColor     ?? '#111111',
      accentColor:       dto.accentColor       ?? '#2563eb',
      borderColor:       dto.borderColor       ?? '#e5e7eb',
      fontSizeBase:      dto.fontSizeBase       ?? 13,
      showCustomerBlock:  dto.showCustomerBlock  ?? true,
      showCostTable:      dto.showCostTable      ?? true,
      showTermsBlock:     dto.showTermsBlock     ?? true,
      showSignatureBlock: dto.showSignatureBlock ?? true,
      showFooter:         dto.showFooter         ?? true,
      // Seed a blank canvas layout — front-end editor populates this later
      layoutJson: dto.layoutJson ?? makeBlankLayoutJson(),
    });
    return toContractTemplateDto(created);
  },

  async update(id: number, dto: Record<string, unknown>): Promise<ContractTemplateResponseDto> {
    const existing = await contractTemplateRepository.findById(id);
    if (!existing) throw new AppError(404, 'Contract template not found.');

    // Handle default flag change
    if (dto.isDefault === true && !existing.isDefault) {
      await contractTemplateRepository.setDefault(id);
      const refreshed = await contractTemplateRepository.findById(id);
      if (!refreshed) throw new AppError(404, 'Contract template not found after update.');
      // Apply any other field changes on top
      const rest = Object.fromEntries(
        Object.entries(dto).filter(([k, v]) => k !== 'isDefault' && v !== undefined),
      ) as Prisma.ContractTemplateUpdateInput;
      if (Object.keys(rest).length > 0) {
        const final = await contractTemplateRepository.update(id, rest);
        return toContractTemplateDto(final);
      }
      return toContractTemplateDto(refreshed);
    }

    const data = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    ) as Prisma.ContractTemplateUpdateInput;

    const updated = await contractTemplateRepository.update(id, data);
    return toContractTemplateDto(updated);
  },

  async delete(id: number): Promise<void> {
    const existing = await contractTemplateRepository.findById(id);
    if (!existing) throw new AppError(404, 'Contract template not found.');
    await contractTemplateRepository.delete(id);
  },
};
