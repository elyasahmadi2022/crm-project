"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Collapsible } from "@base-ui/react/collapsible"
import { Menu } from "@base-ui/react/menu"
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Briefcase,
  TrendingUp,
  DollarSign,
  Settings,
  ChevronsUpDown,
  LogOut,
  ChevronRight,
  FileText,
  Receipt,
  BadgeDollarSign,
  Wallet,
  CreditCard,
  UserCheck,
  ClipboardList,
  Calendar,
  Camera,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

type NavSubItem = { title: string; href: string; icon?: React.ElementType }

type NavItem = {
  title: string
  href: string
  icon: React.ElementType
  children?: NavSubItem[]
}

type NavGroup = {
  label: string
  items: NavItem[]
}

// ─────────────────────────────────────────────────
// Nav config
// ─────────────────────────────────────────────────

const adminNav: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Customers",  href: "/admin/customers",  icon: Users },
      { title: "Leads",      href: "/admin/leads",      icon: TrendingUp },
      { title: "Projects",   href: "/admin/projects",   icon: Briefcase },
      
      {
        title: "Finance",
        href: "/admin/finance",
        icon: DollarSign,
        children: [
          { title: "Overview",  href: "/admin/finance",          icon: BadgeDollarSign },
          { title: "Invoices",  href: "/admin/finance/invoices", icon: FileText },
          { title: "Expenses",  href: "/admin/finance/expenses", icon: Receipt },
          { title: "Accounts",  href: "/admin/finance/accounts", icon: Wallet },
        ],
      },
    ],
  },
  {
    label: "HR & Payroll",
    items: [
      { title: "Employees",   href: "/admin/employees",   icon: UserCheck },
      { title: "Payroll",     href: "/admin/payroll",     icon: CreditCard },
      { title: "Reports",     href: "/admin/reports",     icon: ClipboardList },
      { title: "Attendance",  href: "/admin/attendance",  icon: Calendar },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Templates", href: "/admin/templates", icon: FileText },
      { title: "Users",    href: "/admin/users",    icon: UserCircle },
      { title: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
]

const regularNav: NavGroup[] = [
  {
    label: "My Work",
    items: [
      { title: "Dashboard", href: "/regular/dashboard", icon: LayoutDashboard },
      { title: "My Reports",     href: "/regular/reports",     icon: ClipboardList },
      { title: "My Projects",    href: "/regular/my-projects", icon: Briefcase },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Settings", href: "/regular/settings", icon: Settings },
    ],
  },
]

// ─────────────────────────────────────────────────
// Collapsible nav item with children
// ─────────────────────────────────────────────────

function CollapsibleNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const isAnyChildActive = item.children?.some(
    (c) => pathname === c.href || pathname.startsWith(c.href + "/")
  ) ?? false

  const [open, setOpen] = React.useState(isAnyChildActive)

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <Collapsible.Trigger
          className={cn(
            "flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left text-sm",
            "ring-sidebar-ring outline-hidden transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            "focus-visible:ring-2",
            isAnyChildActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
          )}
        >
          <item.icon className="size-4 shrink-0" />
          <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
          <ChevronRight
            className={cn(
              "ml-auto size-4 shrink-0 transition-transform duration-200",
              "group-data-[collapsible=icon]:hidden",
              "group-data-[state=open]/collapsible:rotate-90",
            )}
          />
        </Collapsible.Trigger>

        <Collapsible.Panel>
          <SidebarMenuSub>
            {item.children?.map((child) => {
              const isActive = pathname === child.href || pathname.startsWith(child.href + "/")
              return (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton
                    render={<Link href={child.href} />}
                    isActive={isActive}
                  >
                    {child.icon && <child.icon className="size-3.5 shrink-0" />}
                    {child.title}
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </Collapsible.Panel>
      </SidebarMenuItem>
    </Collapsible.Root>
  )
}

// ─────────────────────────────────────────────────
// Sidebar footer account menu
// Extracted outside SidebarMenu/SidebarMenuItem so
// Menu.Root sits in a plain div — same DOM depth as
// HeaderProfile — which lets Base UI wire up the
// trigger/popup correctly without sidebar CSS interference.
// ─────────────────────────────────────────────────

interface SidebarAccountMenuProps {
  variant: "admin" | "regular"
  isCollapsed: boolean
  settingsHref: string
}

function SidebarAccountMenu({ variant, isCollapsed, settingsHref }: SidebarAccountMenuProps) {
  const initials = variant === "admin" ? "AD" : "US"
  const name     = variant === "admin" ? "Admin User"             : "My Account"
  const email    = variant === "admin" ? "administrator@luilala.com" : "user@luilala.com"
  const profileHref = variant === "admin" ? "/admin/users" : "/regular/settings"

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm",
          "text-sidebar-foreground",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          "transition-colors",
        )}
      >
        {/* Avatar */}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold select-none">
          {initials}
        </div>
        {/* Name + email — hidden when icon-collapsed */}
        {!isCollapsed && (
          <>
            <div className="flex flex-col gap-0.5 overflow-hidden leading-none">
              <span className="truncate font-semibold">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 shrink-0" />
          </>
        )}
      </Menu.Trigger>

      <Menu.Portal keepMounted>
        <Menu.Positioner side="top" align="start" sideOffset={4} className="z-[200]">
          <Menu.Popup className="min-w-52 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">
            {/* User info header */}
            <div className="flex items-center gap-2 px-2 py-2 mb-1 border-b">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold select-none">
                {initials}
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden leading-none">
                <span className="truncate text-sm font-semibold">{name}</span>
                <span className="truncate text-xs text-muted-foreground">{email}</span>
              </div>
            </div>

            <Menu.Item
              className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent"
              render={<Link href={profileHref} />}
            >
              <UserCircle className="size-4" />
              Profile
            </Menu.Item>
            <Menu.Item
              className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent"
              render={<Link href={settingsHref} />}
            >
              <Settings className="size-4" />
              Settings
            </Menu.Item>
            <Menu.Separator className="my-1 h-px bg-border" />
            <Menu.Item
              className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 data-[highlighted]:bg-destructive/10"
              render={<Link href="/logout" />}
            >
              <LogOut className="size-4" />
              Sign out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

// ─────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────

interface AppSidebarProps {
  variant?: "admin" | "regular"
}

export function AppSidebar({ variant = "regular" }: AppSidebarProps) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const nav = variant === "admin" ? adminNav : regularNav
  const appName = variant === "admin" ? "CRM Admin" : "CRM Portal"
  const dashboardHref = variant === "admin" ? "/admin/dashboard" : "/regular/dashboard"
  const settingsHref  = variant === "admin" ? "/admin/settings"  : "/regular/settings"

  return (
    <Sidebar collapsible="icon">
      {/* ── Header / Branding ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={dashboardHref} />}>
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Briefcase className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden leading-none">
                <span className="truncate font-semibold">{appName}</span>
                <span className="truncate text-xs text-muted-foreground">Luilala CRM</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Nav groups ── */}
      <SidebarContent>
        {nav.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) =>
                  item.children ? (
                    <CollapsibleNavItem key={item.title} item={item} pathname={pathname} />
                  ) : (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                        tooltip={item.title}
                      >
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── Footer / Account ── */}
      <SidebarFooter>
        <SidebarAccountMenu variant={variant} isCollapsed={isCollapsed} settingsHref={settingsHref} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
