/**
 * lib/api.ts
 *
 * Central Axios instance.
 *
 * Responsibilities:
 *  1. Base URL — all requests hit http://localhost:3001/api/v1
 *  2. Credentials — send HttpOnly refreshToken cookie on every request
 *  3. Request interceptor — attach stored accessToken as Bearer header
 *  4. Response interceptor — on 401, attempt one silent token refresh,
 *     then retry the original request. If refresh also fails, clear auth
 *     state and redirect to /login.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

// ── Extend InternalAxiosRequestConfig to track retried requests ──────────
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

// ── Lazy import of auth store avoids circular deps ────────────────────────
// We import getState/setState directly at call-time, not at module load.
function getToken(): string | null {
  // Dynamic import keeps this SSR-safe (no window access at module load).
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem("crm_access_token")
    return raw ?? null
  } catch {
    return null
  }
}

function clearToken(): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem("crm_access_token")
    sessionStorage.removeItem("crm_user")
  } catch {
    // ignore
  }
}

// ── Axios instance ────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1",
  withCredentials: true, // sends refreshToken HttpOnly cookie automatically
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
})

// ── Request interceptor: attach accessToken ───────────────────────────────
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Track if a refresh is already in-flight ───────────────────────────────
let isRefreshing = false
let waitingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function drainQueue(token: string | null, error: unknown = null) {
  waitingQueue.forEach(({ resolve, reject }) =>
    token ? resolve(token) : reject(error),
  )
  waitingQueue = []
}

// ── Response interceptor: silent refresh on 401 ───────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined

    // Only intercept 401s that haven't already been retried
    if (
      error.response?.status !== 401 ||
      original?._retry ||
      !original
    ) {
      return Promise.reject(error)
    }

    // Don't retry the refresh endpoint itself — that would loop forever
    if (original.url?.includes("/auth/refresh")) {
      clearToken()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      return Promise.reject(error)
    }

    original._retry = true

    if (isRefreshing) {
      // Another request already started a refresh — wait for it
      return new Promise<string>((resolve, reject) => {
        waitingQueue.push({ resolve, reject })
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      })
    }

    isRefreshing = true

    try {
      // POST /auth/refresh — no body, relies on the HttpOnly cookie
      const { data } = await api.post<{ status: number; data: { accessToken: string } }>("/auth/refresh")
      const newToken = data.data.accessToken

      // Persist the new token
      if (typeof window !== "undefined") {
        sessionStorage.setItem("crm_access_token", newToken)
      }

      drainQueue(newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch (refreshError) {
      drainQueue(null, refreshError)
      clearToken()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

// ── Helpers ───────────────────────────────────────────────────────────────

/** Extract a human-readable message from any Axios error. */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { message?: string } | undefined)?.message
    return msg ?? error.message ?? fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}
