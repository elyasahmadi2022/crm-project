"use client"

/**
 * providers/query-provider.tsx
 *
 * Wraps the app in TanStack QueryClient with sensible defaults.
 * Must be a client component because QueryClientProvider relies on React context.
 */

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Don't refetch on window focus in a CRM — too noisy
        refetchOnWindowFocus: false,
        // Retry once on failure (not for 4xx — interceptor handles those)
        retry: (failureCount, error: unknown) => {
          const status = (error as { response?: { status?: number } })?.response?.status
          if (status && status >= 400 && status < 500) return false
          return failureCount < 1
        },
        staleTime: 60 * 1000, // 1 minute default
      },
      mutations: {
        // Mutations never retry automatically
        retry: false,
      },
    },
  })
}

// Singleton on the browser; fresh instance per SSR render
let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
