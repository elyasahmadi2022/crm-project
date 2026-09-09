/**
 * lib/auth-store.ts
 *
 * Zustand store for client-side auth state.
 *
 * - accessToken lives in sessionStorage (cleared on tab close)
 * - user summary (id, name, role) lives alongside the token
 * - The HttpOnly refreshToken cookie is managed by the browser; we never
 *   touch it directly.
 *
 * Usage:
 *   const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore()
 */

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type UserRole =
  | "ADMIN"
  | "SALES"
  | "FINANCE"
  | "DEVELOPER"
  | "DESIGNER"

export interface AuthUser {
  id: number
  name: string
  role: UserRole
}

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  /** Convenience flag — true when a valid accessToken is present */
  isAuthenticated: boolean

  /** Called after successful login / register / refresh */
  setAuth: (accessToken: string, user: AuthUser) => void

  /** Called on logout or after a failed refresh */
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      setAuth: (accessToken, user) => {
        // Mirror token into sessionStorage so the Axios interceptor can read
        // it without importing this store (avoids circular deps).
        if (typeof window !== "undefined") {
          sessionStorage.setItem("crm_access_token", accessToken)
          sessionStorage.setItem("crm_user", JSON.stringify(user))
        }
        set({ accessToken, user, isAuthenticated: true })
      },

      clearAuth: () => {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("crm_access_token")
          sessionStorage.removeItem("crm_user")
        }
        set({ accessToken: null, user: null, isAuthenticated: false })
      },
    }),
    {
      name: "crm_auth",
      // Use sessionStorage so state is cleared when the browser tab closes.
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? sessionStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
    },
  ),
)
