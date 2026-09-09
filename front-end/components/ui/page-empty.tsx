import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export interface PageEmptyProps {
  icon: React.ElementType
  title: string
  description: string
  /** Optional action button label */
  actionLabel?: string
  /** Called when the action button is clicked */
  onAction?: () => void
  /** Override the icon wrapper color. Defaults to muted. */
  iconClassName?: string
  className?: string
}

/**
 * Full-page empty state built on top of shadcn/ui <Empty>.
 * Drop this into any route's page when the data array is empty.
 *
 * @example
 * if (!data.length) return (
 *   <PageEmpty
 *     icon={Users}
 *     title="No customers yet"
 *     description="Add your first customer to start managing relationships."
 *     actionLabel="Add Customer"
 *     onAction={() => router.push('/admin/customers/new')}
 *   />
 * )
 */
export function PageEmpty({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  iconClassName,
  className,
}: PageEmptyProps) {
  return (
    <Empty
      className={cn(
        "min-h-[420px] rounded-2xl border border-dashed border-muted-foreground/25 bg-muted/10",
        className,
      )}
    >
      <EmptyHeader>
        <EmptyMedia>
          <div
            className={cn(
              "flex size-16 items-center justify-center rounded-2xl",
              "bg-muted text-muted-foreground",
              iconClassName,
            )}
          >
            <Icon className="size-8" aria-hidden />
          </div>
        </EmptyMedia>
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>

      {actionLabel && onAction && (
        <EmptyContent>
          <Button size="sm" onClick={onAction} className="mt-2">
            {actionLabel}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}
