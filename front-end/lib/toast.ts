/**
 * Thin wrapper around our custom @base-ui toast manager.
 * Provides .success / .error / .info / .warning helpers
 * that match the shape expected by ToastIcon in toast.tsx.
 */
import { toast as manager } from "@/components/ui/toast"

type Options = { description?: string; duration?: number }

export const toast = {
  success(title: string, opts?: Options) {
    manager.add({ title, description: opts?.description, type: "success", timeout: opts?.duration ?? 4000 })
  },
  error(title: string, opts?: Options) {
    manager.add({ title, description: opts?.description, type: "error", timeout: opts?.duration ?? 5000 })
  },
  info(title: string, opts?: Options) {
    manager.add({ title, description: opts?.description, type: "info", timeout: opts?.duration ?? 4000 })
  },
  warning(title: string, opts?: Options) {
    manager.add({ title, description: opts?.description, type: "warning", timeout: opts?.duration ?? 4000 })
  },
  loading(title: string, opts?: Options) {
    return manager.add({ title, description: opts?.description, type: "loading", timeout: 0 })
  },
  dismiss(id: string) {
    manager.close(id)
  },
}
