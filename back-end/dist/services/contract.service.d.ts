import { type ContractResponseDto, type CreateContractDto, type UpdateContractDto, type ListContractsQueryDto } from '../dtos/contract.dto.js';
export declare const contractService: {
    getAll(filters: ListContractsQueryDto, page?: number, limit?: number): Promise<{
        contracts: ContractResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getById(id: number): Promise<ContractResponseDto>;
    create(dto: CreateContractDto, createdById: number): Promise<ContractResponseDto>;
    update(id: number, dto: UpdateContractDto): Promise<ContractResponseDto>;
    delete(id: number): Promise<void>;
};
//# sourceMappingURL=contract.service.d.ts.map