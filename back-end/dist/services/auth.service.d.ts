import { type RegisterDto, type LoginDto, type TokenKeyPairDto, type ForgotPasswordDto, type ResetPasswordDto, type ChangePasswordDto, type UpdateProfileDto, type ProfileResponseDto } from "../dtos/user.dto.js";
import { UserRole } from "../generated/prisma/index.js";
export interface AuthInternalResult {
    accessToken: string;
    refreshToken: string;
    user: {
        id: number;
        name: string;
        role: UserRole;
    };
}
export declare const authService: {
    generateTokenSet: (id: number, role: UserRole) => TokenKeyPairDto;
    register: (dto: RegisterDto) => Promise<AuthInternalResult>;
    login: (dto: LoginDto) => Promise<AuthInternalResult>;
    refreshSession: (oldRefreshToken: string) => Promise<TokenKeyPairDto>;
    forgotPassword: (dto: ForgotPasswordDto) => Promise<void>;
    verifyOtp: (email: string, otp: string) => Promise<{
        resetToken: string;
    }>;
    resetPassword: (dto: ResetPasswordDto) => Promise<void>;
    changePassword: (userId: number, dto: ChangePasswordDto) => Promise<void>;
    updateProfile: (userId: number, dto: UpdateProfileDto) => Promise<ProfileResponseDto>;
    updateAvatar: (userId: number, avatarUrl: string) => Promise<ProfileResponseDto>;
    getMyProfile: (userId: number) => Promise<ProfileResponseDto>;
};
//# sourceMappingURL=auth.service.d.ts.map