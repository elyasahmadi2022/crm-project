import { AccountType } from "../generated/prisma";
export interface CreateAccountDto {
    name: string;
    type: AccountType;
    balance?: number;
    currency?: string;
    description?: string;
}
export interface UpdateAccountDto {
    name?: string;
    type?: AccountType;
    currency?: string;
    description?: string;
    isActive?: boolean;
}
export interface AccountTransactionDto {
    amount: number;
    description?: string;
    reference?: string;
    referenceType?: string;
    referenceId?: number;
}
export interface TransferDto {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    description?: string;
    reference?: string;
}
//# sourceMappingURL=account.dto.d.ts.map