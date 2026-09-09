import { type UpdateCompanySettingsDto, type UpsertContractTemplateDto, type CompanySettingsResponseDto, type ContractTemplateResponseDto } from '../dtos/company.dto.js';
export declare const companyService: {
    get(): Promise<CompanySettingsResponseDto>;
    update(dto: UpdateCompanySettingsDto): Promise<CompanySettingsResponseDto>;
    updateLogo(logoUrl: string | null): Promise<CompanySettingsResponseDto>;
};
export declare const contractTemplateService: {
    getAll(): Promise<ContractTemplateResponseDto[]>;
    getById(id: number): Promise<ContractTemplateResponseDto>;
    getDefault(): Promise<ContractTemplateResponseDto | null>;
    create(dto: UpsertContractTemplateDto): Promise<ContractTemplateResponseDto>;
    update(id: number, dto: Record<string, unknown>): Promise<ContractTemplateResponseDto>;
    delete(id: number): Promise<void>;
};
//# sourceMappingURL=company.service.d.ts.map