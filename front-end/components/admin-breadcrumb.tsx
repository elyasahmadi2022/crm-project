"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// ─────────────────────────────────────────────────
// Segment → human-readable label map.
// Extend this as you add new routes.
// ─────────────────────────────────────────────────
const SEGMENT_LABELS: Record<string, string> = {
  admin:     "Admin",
  dashboard: "Dashboard",
  customers: "Customers",
  leads:     "Leads",
  projects:  "Projects",
  finance:   "Finance",
  invoices:  "Invoices",
  expenses:  "Expenses",
  reports:   "Reports",
  marketing: "Marketing",
  campaigns: "Campaigns",
  analytics: "Analytics",
  users:     "Users",
  settings:  "Settings",
  profile:   "Profile",
}

/** Turn a raw URL segment into a readable label. */
function labelFor(segment: string): string {
  // Known segment
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]
  // Looks like a UUID / numeric id → generic fallback
  if (/^[0-9a-f-]{8,}$/i.test(segment) || /^\d+$/.test(segment)) return "Details"
  // Slug: kebab-case → Title Case
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

// ─────────────────────────────────────────────────
// Crumb shape
// ─────────────────────────────────────────────────
interface Crumb {
  label: string
  href: string
}

// Max visible segments before collapsing with ellipsis
const MAX_VISIBLE = 4

export function AdminBreadcrumb() {
  const pathname = usePathname()

  // Split path into segments, drop empty strings
  const segments = pathname.split("/").filter(Boolean)

  // Build the full crumb trail: each entry accumulates the href
  const crumbs: Crumb[] = segments.map((seg, i) => ({
    label: labelFor(seg),
    href:  "/" + segments.slice(0, i + 1).join("/"),
  }))

  // Nothing to show for root
  if (crumbs.length === 0) return null

  // ── Collapse logic ───────────────────────────────
  // Keep first crumb + last 2 crumbs; collapse the middle ones.
  // Only kicks in when we have more than MAX_VISIBLE crumbs.
  const shouldCollapse = crumbs.length > MAX_VISIBLE

  let visibleCrumbs: (Crumb | "ellipsis")[]

  if (shouldCollapse) {
    visibleCrumbs = [
      crumbs[0],
      "ellipsis",
      ...crumbs.slice(-2),
    ]
  } else {
    visibleCrumbs = crumbs
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {visibleCrumbs.map((item, index) => {
          const isLast = index === visibleCrumbs.length - 1

          if (item === "ellipsis") {
            return (
              <React.Fragment key="ellipsis">
                <BreadcrumbItem>
                  <BreadcrumbEllipsis />
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </React.Fragment>
            )
          }

          return (
            <React.Fragment key={item.href}>
              <BreadcrumbItem>
                {isLast ? (
                  // Current page — non-clickable
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  // Ancestor — clickable link
                  <BreadcrumbLink render={<Link href={item.href} />}>
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {/* Separator after every item except the last */}
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
