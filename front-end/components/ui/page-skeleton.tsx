import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────
// Reusable skeleton primitives
// ─────────────────────────────────────────────────

/** A standard page header skeleton (title + subtitle). */
function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  )
}

/** A row of N stat cards */
function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <Skeleton className="size-10 rounded-lg shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** A table-style skeleton: header row + N body rows × M columns */
function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 border-b px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Body */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className={cn("flex items-center gap-4 px-4 py-3 border-b last:border-0", r % 2 === 1 && "bg-muted/20")}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn("h-4 flex-1", c === 0 && "max-w-[180px]", c === cols - 1 && "max-w-[80px]")}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** A chart card skeleton */
function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>
      <div className="px-6 py-4">
        <Skeleton className={`w-full rounded-lg`} style={{ height }} />
      </div>
    </div>
  )
}

/** A card with a short list of items */
function ListCardSkeleton({ rows = 5, title = true }: { rows?: number; title?: boolean }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {title && (
        <div className="flex flex-col gap-2 border-b px-4 py-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      )}
      <div className="flex flex-col divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** A kanban-strip skeleton (Lead pipeline) */
function KanbanSkeleton({ cols = 6, cardsPerCol = 2 }: { cols?: number; cardsPerCol?: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-2 mb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-${cols}`}>
        {Array.from({ length: cols }).map((_, ci) => (
          <div key={ci} className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-5 rounded-full" />
            </div>
            {Array.from({ length: cardsPerCol }).map((_, ri) => (
              <div key={ri} className="rounded-lg border bg-background p-2 flex flex-col gap-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-2.5 w-8 mt-0.5" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** A form-style skeleton for settings pages */
function FormSkeleton({ sections = 2, fieldsPerSection = 3 }: { sections?: number; fieldsPerSection?: number }) {
  return (
    <div className="rounded-xl border bg-card p-6 flex flex-col gap-8">
      {Array.from({ length: sections }).map((_, si) => (
        <div key={si} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-64" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: fieldsPerSection }).map((_, fi) => (
              <div key={fi} className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  )
}

/** A profile/avatar + info skeleton (Users page) */
function UserCardSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-5 flex flex-col items-center gap-3">
          <Skeleton className="size-16 rounded-full" />
          <div className="flex flex-col gap-1.5 items-center w-full">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-5 w-16 rounded-full mt-1" />
          </div>
          <Skeleton className="h-8 w-full rounded-lg mt-1" />
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────
// Route-specific loading compositions
// ─────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <HeaderSkeleton />
      <ChartSkeleton height={280} />
      <StatCardsSkeleton count={4} />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8"><TableSkeleton rows={5} cols={5} /></div>
        <div className="col-span-12 lg:col-span-4"><ListCardSkeleton rows={5} /></div>
      </div>
      <KanbanSkeleton cols={6} cardsPerCol={2} />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6"><ListCardSkeleton rows={4} /></div>
        <div className="col-span-12 lg:col-span-6"><TableSkeleton rows={3} cols={5} /></div>
      </div>
      <ListCardSkeleton rows={5} />
    </div>
  )
}

export function TablePageSkeleton({ title = true }: { title?: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      {title && <HeaderSkeleton />}
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <TableSkeleton rows={8} cols={5} />
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="size-8 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function FinancePageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <HeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8"><TableSkeleton rows={7} cols={6} /></div>
        <div className="col-span-12 lg:col-span-4"><ListCardSkeleton rows={5} /></div>
      </div>
    </div>
  )
}

export function MarketingPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <HeaderSkeleton />
      <StatCardsSkeleton count={3} />
      <ChartSkeleton height={220} />
      <TableSkeleton rows={6} cols={6} />
    </div>
  )
}

export function SettingsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <HeaderSkeleton />
      <FormSkeleton sections={3} fieldsPerSection={4} />
    </div>
  )
}

export function UsersPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <HeaderSkeleton />
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <UserCardSkeleton count={8} />
    </div>
  )
}
