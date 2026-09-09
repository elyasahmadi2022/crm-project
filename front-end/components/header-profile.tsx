"use client"

import Link from "next/link"
import { Menu } from "@base-ui/react/menu"
import {
  UserCircle,
  Settings,
  LogOut,
  HelpCircle,
  LayoutDashboard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useLogoutMutation, useProfileQuery } from "@/queries/auth.queries"
import { Skeleton } from "@/components/ui/skeleton"

interface HeaderProfileProps {
  variant?: "admin" | "regular"
}

/** Renders an avatar circle: shows image if url exists, otherwise shows initials */
function UserAvatar({
  url,
  initials,
  size = "sm",
}: {
  url: string | null
  initials: string
  size?: "sm" | "md"
}) {
  const dim = size === "sm" ? "size-8" : "size-9"
  return (
    <span
      className={cn(
        dim,
        "relative flex shrink-0 items-center justify-center rounded-full overflow-hidden",
        "bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold select-none",
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="avatar"
          className="absolute inset-0 size-full rounded-full object-cover"
          onError={(e) => {
            // hide broken image — fallback initials underneath will show
            ;(e.currentTarget as HTMLImageElement).style.display = "none"
          }}
        />
      ) : null}
      {initials}
    </span>
  )
}

export function HeaderProfile({ variant = "regular" }: HeaderProfileProps) {
  const { mutate: logout } = useLogoutMutation()
  const { data: profile, isLoading } = useProfileQuery()
  

  const isAdmin  = variant === "admin"
  const dashHref = isAdmin ? "/admin/dashboard"  : "/regular/dashboard"
  const settHref = isAdmin ? "/admin/settings"   : "/regular/settings"

  // Derive display values — fall back gracefully while loading
  const name      = profile?.name  ?? (isAdmin ? "Admin User"  : "Portal User")
  const email     = profile?.email ?? (isAdmin ? "administrator@luilala.com" : "user@luilala.com")
  const role      = profile?.role  ?? (isAdmin ? "ADMIN" : "USER")
  const avatarUrl = profile?.avatarUrl ?? null
  const initials  = (profile?.name ?? (isAdmin ? "Admin User" : "Portal User"))
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

  const roleLabel: Record<string, string> = {
    ADMIN: "Administrator",
    SALES: "Sales",
    SUPPORT: "Support",
    USER: "User",
  }

  return (
    <div className="flex items-center gap-2">
      {/* Notification bell */}
      <NotificationDropdown />

      {/* Avatar dropdown */}
      <Menu.Root>
        <Menu.Trigger
          aria-label="Open user menu"
          className={cn(
            "cursor-pointer rounded-full select-none",
            "ring-2 ring-background hover:opacity-90 transition-opacity",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {isLoading ? (
            <Skeleton className="size-8 rounded-full" />
          ) : (
            <UserAvatar url={avatarUrl} initials={initials} size="sm" />
          )}
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-[200]">
            <Menu.Popup className="z-50 min-w-56 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg p-1">

              {/* User info header */}
              <div className="flex items-center gap-3 px-2 py-2 mb-1 border-b">
                {isLoading ? (
                  <>
                    <Skeleton className="size-9 rounded-full shrink-0" />
                    <div className="flex flex-col gap-1.5 flex-1">
                      <Skeleton className="h-3 w-28 rounded" />
                      <Skeleton className="h-3 w-36 rounded" />
                    </div>
                  </>
                ) : (
                  <>
                    <UserAvatar url={avatarUrl} initials={initials} size="md" />
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <span className="truncate text-sm font-semibold">{name}</span>
                      <span className="truncate text-xs text-muted-foreground">{email}</span>
                      <span className="text-xs font-medium text-primary">
                        {roleLabel[role] ?? role}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Nav items */}
              <Menu.Item
                className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent"
                render={<Link href={dashHref} />}
              >
                <LayoutDashboard className="size-4" />
                Dashboard
              </Menu.Item>

              <Menu.Item
                className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent"
                render={<Link href={settHref} />}
              >
                <UserCircle className="size-4" />
                My Profile
              </Menu.Item>

              <Menu.Item
                className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent"
                render={<Link href={settHref} />}
              >
                <Settings className="size-4" />
                Settings
              </Menu.Item>

              <Menu.Item
                className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent"
                render={<Link href="/help" />}
              >
                <HelpCircle className="size-4" />
                Help &amp; Support
              </Menu.Item>

              <Menu.Separator className="my-1 h-px bg-border" />

              <Menu.Item
                onClick={() => logout()}
                className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 data-[highlighted]:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Sign out
              </Menu.Item>

            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  )
}
