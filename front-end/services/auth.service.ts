/**
 * services/auth.service.ts
 *
 * Pure typed wrappers around every /api/v1/auth endpoint.
 *
 * The backend wraps every success response as:
 *   { status: number, data: T }
 *
 * So Axios gives us r.data = { status, data: T } and the actual
 * payload is always at r.data.data.
 */

import { api } from "@/lib/api"
import type { AuthUser, UserRole } from "@/lib/auth-store"

// ─────────────────────────────────────────────────
// Backend envelope — every sendSuccess() call wraps in this
// ─────────────────────────────────────────────────
interface ApiEnvelope<T> {
  status: number
  data: T
}

// ─────────────────────────────────────────────────
// Response payload types (inner `data` field)
// ─────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export interface RefreshResponse {
  accessToken: string
}

export interface MessageResponse {
  message: string
}

export interface VerifyOtpResponse {
  resetToken: string
  message: string
}

export interface ProfileResponse {
  id: number
  name: string
  email: string
  role: UserRole
  avatarUrl: string | null
  forcePasswordChange: boolean
  updatedAt: string
  // Employee-specific fields
  position: string | null
  department: string | null
  joinDate: string | null
  salary: number | string | null
  faceEmbedding: string | null
}

// ─────────────────────────────────────────────────
// Request DTOs
// ─────────────────────────────────────────────────

export interface RegisterDto {
  name: string
  email: string
  password: string
  role: UserRole
}

export interface LoginDto {
  email: string
  password: string
}

export interface ForgotPasswordDto {
  email: string
}

export interface VerifyOtpDto {
  email: string
  otp: string
}

export interface ResetPasswordDto {
  resetToken: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UpdateProfileDto {
  name?: string
}

// ─────────────────────────────────────────────────
// Helper — unwrap the envelope
// ─────────────────────────────────────────────────
function unwrap<T>(r: { data: ApiEnvelope<T> }): T {
  console.log(r)
  return r.data.data
}

// ─────────────────────────────────────────────────
// Service methods
// ─────────────────────────────────────────────────

export const authService = {
  /** POST /auth/register → AuthResponse (accessToken + user) + sets refreshToken cookie */
  register: (dto: RegisterDto) =>
    api.post<ApiEnvelope<AuthResponse>>("/auth/register", dto).then(unwrap),

  /** POST /auth/login → AuthResponse (accessToken + user) + sets refreshToken cookie */
  login: (dto: LoginDto) =>
    api.post<ApiEnvelope<AuthResponse>>("/auth/login", dto).then(unwrap),

  /** POST /auth/refresh → { accessToken } — uses HttpOnly refreshToken cookie */
  refresh: () =>
    api.post<ApiEnvelope<RefreshResponse>>("/auth/refresh").then(unwrap),

  /** POST /auth/logout — clears the refreshToken cookie */
  logout: () =>
    api.post<ApiEnvelope<MessageResponse>>("/auth/logout").then(unwrap),

  /** POST /auth/forgot-password — always 200 (anti-enumeration) */
  forgotPassword: (dto: ForgotPasswordDto) =>
    api.post<ApiEnvelope<MessageResponse>>("/auth/forgot-password", dto).then(unwrap),

  /** POST /auth/verify-otp → { resetToken, message } */
  verifyOtp: (dto: VerifyOtpDto) =>
    api.post<ApiEnvelope<VerifyOtpResponse>>("/auth/verify-otp", dto).then(unwrap),

  /** POST /auth/reset-password → { message } */
  resetPassword: (dto: ResetPasswordDto) =>
    api.post<ApiEnvelope<MessageResponse>>("/auth/reset-password", dto).then(unwrap),

  /** POST /auth/change-password (auth required) → { message } */
  changePassword: (dto: ChangePasswordDto) =>
    api.post<ApiEnvelope<MessageResponse>>("/auth/change-password", dto).then(unwrap),

  /** GET /auth/me (auth required) → ProfileResponse */
  getProfile: () =>
    api.get<ApiEnvelope<ProfileResponse>>("/auth/me").then(unwrap),

  /** PATCH /auth/me (auth required) → ProfileResponse */
  updateProfile: (dto: UpdateProfileDto) =>
    api.patch<ApiEnvelope<ProfileResponse>>("/auth/me", dto).then(unwrap),

  /** POST /auth/me/avatar (auth required) — multipart/form-data, field: "avatar" */
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append("avatar", file)
    return api
      .post<ApiEnvelope<ProfileResponse>>("/auth/me/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(unwrap)
  },

  /** DELETE /auth/me/avatar (auth required) → ProfileResponse with avatarUrl: null */
  deleteAvatar: () =>
    api.delete<ApiEnvelope<ProfileResponse>>("/auth/me/avatar").then(unwrap),
}
