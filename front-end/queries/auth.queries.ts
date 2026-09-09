/**
 * queries/auth.queries.ts
 *
 * All TanStack Query hooks for auth.
 *
 * Convention:
 *   useXxxQuery   → useQuery  (read, cached)
 *   useXxxMutation → useMutation (write, side-effects)
 *
 * Mutations call useAuthStore to keep client state in sync after
 * successful server responses.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth.service"
import { useAuthStore } from "@/lib/auth-store"
import { getApiErrorMessage } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import type {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from "@/services/auth.service"

// Convenience shim — Base UI's toast manager uses .add()
const showToast = (opts: Parameters<typeof toast.add>[0]) => toast.add(opts)

// ── Query keys ────────────────────────────────────────────────────────────
export const authKeys = {
  profile: ["auth", "profile"] as const,
}

// ─────────────────────────────────────────────────
// useLoginMutation
// ─────────────────────────────────────────────────
export function useLoginMutation() {
  const { setAuth } = useAuthStore()
  const qc = useQueryClient()


  return useMutation({
    mutationFn: (dto: LoginDto) => authService.login(dto),
    
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user)
      qc.invalidateQueries({ queryKey: authKeys.profile })
      showToast({
        title: "Welcome back!",
        description: `Signed in as ${data.user.name}.`,
        type: "success",
      })
      // Redirect is handled by the caller (login page respects ?from= param)
    },
    onError: (error) => {
      showToast({
        title: "Sign in failed",
        description: getApiErrorMessage(error),
        type: "error",
      })
    },
  })
}

// ─────────────────────────────────────────────────
// useRegisterMutation
// ─────────────────────────────────────────────────
export function useRegisterMutation() {
  const { setAuth } = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: (dto: RegisterDto) => authService.register(dto),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user)
      showToast({
        title: "Account created",
        description: "Welcome aboard! Redirecting to your dashboard.",
        type: "success",
      })
      router.push(
        data.user.role === "ADMIN" ? "/admin/dashboard" : "/regular/dashboard",
      )
    },
    onError: (error) => {
      showToast({
        title: "Registration failed",
        description: getApiErrorMessage(error),
        type: "error",
      })
    },
  })
}

// ─────────────────────────────────────────────────
// useLogoutMutation
// ─────────────────────────────────────────────────
export function useLogoutMutation() {
  const { clearAuth } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuth()
      qc.clear()
      router.push("/login")
    },
    onError: () => {
      // Force local logout even if the server call fails
      clearAuth()
      qc.clear()
      router.push("/login")
    },
  })
}

// ─────────────────────────────────────────────────
// useForgotPasswordMutation
// ─────────────────────────────────────────────────
export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (dto: ForgotPasswordDto) => authService.forgotPassword(dto),
    onError: (error) => {
      // Server always 200s — this only fires on network errors
      showToast({
        title: "Error",
        description: getApiErrorMessage(error),
        type: "error",
      })
    },
  })
}

// ─────────────────────────────────────────────────
// useVerifyOtpMutation
// ─────────────────────────────────────────────────
export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: (dto: VerifyOtpDto) => authService.verifyOtp(dto),
    onError: (error) => {
      showToast({
        title: "Invalid code",
        description: getApiErrorMessage(error, "The OTP is invalid or has expired."),
        type: "error",
      })
    },
  })
}

// ─────────────────────────────────────────────────
// useResetPasswordMutation
// ─────────────────────────────────────────────────
export function useResetPasswordMutation() {
  const router = useRouter()

  return useMutation({
    mutationFn: (dto: ResetPasswordDto) => authService.resetPassword(dto),
    onSuccess: () => {
      showToast({
        title: "Password reset",
        description: "Your password has been updated. Please sign in.",
        type: "success",
      })
      router.push("/login")
    },
    onError: (error) => {
      showToast({
        title: "Reset failed",
        description: getApiErrorMessage(error),
        type: "error",
      })
    },
  })
}

// ─────────────────────────────────────────────────
// useChangePasswordMutation
// ─────────────────────────────────────────────────
export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (dto: ChangePasswordDto) => authService.changePassword(dto),
    onSuccess: () => {
      showToast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
        type: "success",
      })
    },
    onError: (error) => {
      showToast({
        title: "Failed to change password",
        description: getApiErrorMessage(error),
        type: "error",
      })
    },
  })
}

// ─────────────────────────────────────────────────
// useProfileQuery
// ─────────────────────────────────────────────────
export function useProfileQuery() {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: authKeys.profile,
    queryFn: () => authService.getProfile(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}

// ─────────────────────────────────────────────────
// useUpdateProfileMutation
// ─────────────────────────────────────────────────
export function useUpdateProfileMutation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (dto: UpdateProfileDto) => authService.updateProfile(dto),
    onSuccess: (data) => {
      qc.setQueryData(authKeys.profile, data)
      showToast({
        title: "Profile updated",
        description: "Your changes have been saved.",
        type: "success",
      })
    },
    onError: (error) => {
      showToast({
        title: "Update failed",
        description: getApiErrorMessage(error),
        type: "error",
      })
    },
  })
}

// ─────────────────────────────────────────────────
// useUploadAvatarMutation
// ─────────────────────────────────────────────────
export function useUploadAvatarMutation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => authService.uploadAvatar(file),
    onSuccess: (data) => {
      qc.setQueryData(authKeys.profile, data)
      showToast({
        title: "Avatar updated",
        description: "Your profile picture has been changed.",
        type: "success",
      })
    },
    onError: (error) => {
      showToast({
        title: "Upload failed",
        description: getApiErrorMessage(error),
        type: "error",
      })
    },
  })
}

// ─────────────────────────────────────────────────
// useDeleteAvatarMutation
// ─────────────────────────────────────────────────
export function useDeleteAvatarMutation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () => authService.deleteAvatar(),
    onSuccess: (data) => {
      qc.setQueryData(authKeys.profile, data)
      showToast({
        title: "Avatar removed",
        description: "Your profile picture has been removed.",
        type: "success",
      })
    },
    onError: (error) => {
      showToast({
        title: "Failed to remove avatar",
        description: getApiErrorMessage(error),
        type: "error",
      })
    },
  })
}
