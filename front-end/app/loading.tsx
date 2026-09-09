import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading...
      </div>
    </div>
  )
}