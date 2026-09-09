import type { CreateAccountDto, UpdateAccountDto, AccountTransactionDto, TransferDto } from "../dtos/account.dto.js";
export declare class AccountService {
    createAccount(dto: CreateAccountDto): Promise<{
        id: number;
        name: string;
        type: import("../generated/prisma/index.js").$Enums.AccountType;
        balance: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    listAccounts(isActive?: boolean): Promise<{
        id: number;
        name: string;
        type: import("../generated/prisma/index.js").$Enums.AccountType;
        balance: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getAccountById(id: number): Promise<{
        transactions: {
            id: number;
            accountId: number;
            type: import("../generated/prisma/index.js").$Enums.TransactionType;
            amount: import("@prisma/client-runtime-utils").Decimal;
            balanceAfter: import("@prisma/client-runtime-utils").Decimal;
            description: string | null;
            reference: string | null;
            referenceType: string | null;
            referenceId: number | null;
            transactionDate: Date;
            createdAt: Date;
        }[];
    } & {
        id: number;
        name: string;
        type: import("../generated/prisma/index.js").$Enums.AccountType;
        balance: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateAccount(id: number, dto: UpdateAccountDto): Promise<{
        id: number;
        name: string;
        type: import("../generated/prisma/index.js").$Enums.AccountType;
        balance: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteAccount(id: number): Promise<{
        id: number;
        name: string;
        type: import("../generated/prisma/index.js").$Enums.AccountType;
        balance: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deposit(accountId: number, dto: AccountTransactionDto): Promise<{
        id: number;
        accountId: number;
        type: import("../generated/prisma/index.js").$Enums.TransactionType;
        amount: import("@prisma/client-runtime-utils").Decimal;
        balanceAfter: import("@prisma/client-runtime-utils").Decimal;
        description: string | null;
        reference: string | null;
        referenceType: string | null;
        referenceId: number | null;
        transactionDate: Date;
        createdAt: Date;
    }>;
    withdraw(accountId: number, dto: AccountTransactionDto): Promise<{
        id: number;
        accountId: number;
        type: import("../generated/prisma/index.js").$Enums.TransactionType;
        amount: import("@prisma/client-runtime-utils").Decimal;
        balanceAfter: import("@prisma/client-runtime-utils").Decimal;
        description: string | null;
        reference: string | null;
        referenceType: string | null;
        referenceId: number | null;
        transactionDate: Date;
        createdAt: Date;
    }>;
    transfer(dto: TransferDto): Promise<{
        debitTx: {
            id: number;
            accountId: number;
            type: import("../generated/prisma/index.js").$Enums.TransactionType;
            amount: import("@prisma/client-runtime-utils").Decimal;
            balanceAfter: import("@prisma/client-runtime-utils").Decimal;
            description: string | null;
            reference: string | null;
            referenceType: string | null;
            referenceId: number | null;
            transactionDate: Date;
            createdAt: Date;
        };
        creditTx: {
            id: number;
            accountId: number;
            type: import("../generated/prisma/index.js").$Enums.TransactionType;
            amount: import("@prisma/client-runtime-utils").Decimal;
            balanceAfter: import("@prisma/client-runtime-utils").Decimal;
            description: string | null;
            reference: string | null;
            referenceType: string | null;
            referenceId: number | null;
            transactionDate: Date;
            createdAt: Date;
        };
    }>;
    getTransactions(accountId: number, limit?: number): Promise<({
        account: {
            id: number;
            name: string;
            type: import("../generated/prisma/index.js").$Enums.AccountType;
            balance: import("@prisma/client-runtime-utils").Decimal;
            currency: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: number;
        accountId: number;
        type: import("../generated/prisma/index.js").$Enums.TransactionType;
        amount: import("@prisma/client-runtime-utils").Decimal;
        balanceAfter: import("@prisma/client-runtime-utils").Decimal;
        description: string | null;
        reference: string | null;
        referenceType: string | null;
        referenceId: number | null;
        transactionDate: Date;
        createdAt: Date;
    })[]>;
    getBalanceSummary(): Promise<{
        totalBalance: number;
        byType: Record<string, number>;
        accounts: {
            id: number;
            name: string;
            type: import("../generated/prisma/index.js").$Enums.AccountType;
            balance: number;
            currency: string;
        }[];
    }>;
}
//# sourceMappingURL=account.service.d.ts.map