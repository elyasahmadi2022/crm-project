"use client"

import * as React from "react"
import { Menu } from "@base-ui/react/menu"
import { Bell, CheckCheck, Info, AlertTriangle, ShoppingCart, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────
// Mock notification data — replace with real data later
// ─────────────────────────────────────────────────

type NotifType = "info" | "warning" | "order" | "user"

interface Notification {
  id: string
  type: NotifType
  title: string
  description: string
  time: string
  read: boolean
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "user",
    title: "New customer registered",
    description: "John Doe signed up and is pending approval.",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    type: "order",
    title: "New project created",
    description: "Project #1042 has been submitted for review.",
    time: "15 min ago",
    read: false,
  },
  {
    id: "3",
    type: "warning",
    title: "Payment overdue",
    description: "Invoice #889 is 3 days past due.",
    time: "1 hr ago",
    read: false,
  },
  {
    id: "4",
    type: "info",
    title: "System update completed",
    description: "CRM was updated to v2.4.1 successfully.",
    time: "3 hrs ago",
    read: true,
  },
  {
    id: "5",
    type: "info",
    title: "Marketing report ready",
    description: "Your monthly analytics report is available.",
    time: "Yesterday",
    read: true,
  },
]

const typeIcon: Record<NotifType, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  order: ShoppingCart,
  user: UserPlus,
}

const typeColor: Record<NotifType, string> = {
  info: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  warning: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400",
  order: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
  user: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
}

// ─────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────

export function NotificationDropdown() {
  const [notifications, setNotifications] = React.useState(MOCK_NOTIFICATIONS)
  const unreadCount = notifications.filter((n) => !n.read).length

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        className={cn(
          "relative cursor-pointer flex size-8 items-center justify-center rounded-full",
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Menu.Trigger>

      <Menu.Portal keepMounted>
        <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-[200]">
          <Menu.Popup className="w-80 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification list */}
            <div className="max-h-[340px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
                  <Bell className="size-8 opacity-30" />
                  <span>No notifications</span>
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = typeIcon[notif.type]
                  return (
                    <Menu.Item
                      key={notif.id}
                      className={cn(
                        "flex cursor-pointer select-none gap-3 px-3 py-3 text-sm outline-none transition-colors",
                        "hover:bg-accent data-[highlighted]:bg-accent",
                        "border-b last:border-b-0",
                        !notif.read && "bg-accent/40",
                      )}
                      onClick={() => markRead(notif.id)}
                    >
                      {/* Icon badge */}
                      <div
                        className={cn(
                          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                          typeColor[notif.type],
                        )}
                      >
                        <Icon className="size-3.5" />
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                        <div className="flex items-start justify-between gap-2">
                          <span className={cn("truncate font-medium leading-tight", !notif.read && "font-semibold")}>
                            {notif.title}
                          </span>
                          {!notif.read && (
                            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-destructive" />
                          )}
                        </div>
                        <span className="line-clamp-2 text-xs text-muted-foreground leading-snug">
                          {notif.description}
                        </span>
                        <span className="text-xs text-muted-foreground/70 mt-0.5">{notif.time}</span>
                      </div>
                    </Menu.Item>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-3 py-2">
              <button className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
                View all notifications
              </button>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
