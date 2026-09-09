"use client"

/**
 * components/auth-guard.tsx
 *
 * Client-side route protection.
 *
 * - Reads the Zustand auth store (sessionStorage-backed).
 * - If not authenticated → redirects to /login immediately.
 * - If authenticated but wrong role → redirects to the correct dashboard.
 * - While hydrating (first render) → shows nothing to avoid flash.
 *
 * Usage:
 *   <AuthGuard requiredRole="ADMIN">{children}</AuthGuard>
 *   <AuthGuard>{children}</AuthGuard>   ← any authenticated user
 */

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore, type UserRole } from "@/lib/auth-store"

interface AuthGuardProps {
  children: React.ReactNode
  /** If provided, the user must have exactly this role. Others are redirected. */
  requiredRole?: UserRole
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()
  const [checked, setChecked] = React.useState(false)

  React.useEffect(() => {
    // Not logged in → always send to login with a `from` param so after
    // login the user lands back where they were trying to go.
    if (!isAuthenticated || !user) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`)
      return
    }

    // Wrong role → redirect to the correct dashboard instead of 404-ing
    if (requiredRole && user.role !== requiredRole) {
      const dest =
        user.role === "ADMIN" ? "/admin/dashboard" : "/regular/dashboard"
      router.replace(dest)
      return
    }

    setChecked(true)
  }, [isAuthenticated, user, requiredRole, router, pathname])

  // Avoid flashing protected content before the check completes
  if (!checked) return null

  return <>{children}</>
}
