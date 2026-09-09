"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus, Search, Pencil, Trash2, Loader2,
  UserCheck, UserX, ShieldCheck, Users,
  ToggleLeft, ToggleRight,
} from "lucide-react"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Badge }    from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty"

import {
  useListUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "@/queries/user.queries"
import { useAuthStore } from "@/lib/auth-store"
import type { UserDto, UserRole, ListUsersQuery } from "@/services/user.service"

// ── constants ─────────────────────────────────────────────────────────────────
const ALL_ROLES: UserRole[] = ["ADMIN", "SALES", "FINANCE", "DEVELOPER", "DESIGNER"]
const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator", SALES: "Sales", FINANCE: "Finance",
  DEVELOPER: "Developer", DESIGNER: "Designer",
}
const ROLE_CLASS: Record<UserRole, string> = {
  ADMIN:     "bg-red-100 text-red-700 border-transparent dark:bg-red-900/30 dark:text-red-300",
  SALES:     "bg-blue-100 text-blue-700 border-transparent dark:bg-blue-900/30 dark:text-blue-300",
  FINANCE:   "bg-green-100 text-green-700 border-transparent dark:bg-green-900/30 dark:text-green-300",
  DEVELOPER: "bg-purple-100 text-purple-700 border-transparent dark:bg-purple-900/30 dark:text-purple-300",
  DESIGNER:  "bg-orange-100 text-orange-700 border-transparent dark:bg-orange-900/30 dark:text-orange-300",
}

// ── shared helpers ────────────────────────────────────────────────────────────
function fmtDate(val: string) {
  return new Date(val).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}
function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
}
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

// ── skeleton / empty ──────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 8 }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold leading-none mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
function UserAvatar({ name }: { name: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold select-none">
      {getInitials(name)}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════
const createSchema = z.object({
  name:  z.string().min(1, "Full name is required.").min(2, "Name must be at least 2 characters."),
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
  role:  z.enum(["ADMIN", "SALES", "FINANCE", "DEVELOPER", "DESIGNER"] as const, {
    errorMap: () => ({ message: "Please select a role." }),
  }),
})
type CreateFormValues = z.infer<typeof createSchema>

const editSchema = z.object({
  name:     z.string().min(1, "Full name is required.").min(2, "Name must be at least 2 characters."),
  email:    z.string().min(1, "Email is required.").email("Enter a valid email address."),
  role:     z.enum(["ADMIN", "SALES", "FINANCE", "DEVELOPER", "DESIGNER"] as const, {
    errorMap: () => ({ message: "Please select a role." }),
  }),
  isActive: z.boolean(),
})
type EditFormValues = z.infer<typeof editSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE FORM
// ═══════════════════════════════════════════════════════════════════════════════
function CreateUserForm({ onClose }: { onClose: () => void }) {
  const mutation = useCreateUserMutation()
  const { register, handleSubmit, control, formState: { errors } } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", email: "", role: "SALES" },
    mode: "onTouched",
  })

  function onSubmit(values: CreateFormValues) {
    mutation.mutate(values, { onSuccess: onClose })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cu-name" className="text-sm font-medium">
          Full name <span className="text-destructive">*</span>
        </label>
        <Input id="cu-name" placeholder="Jane Doe" aria-invalid={!!errors.name} {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cu-email" className="text-sm font-medium">
          Email address <span className="text-destructive">*</span>
        </label>
        <Input id="cu-email" type="email" placeholder="jane@luilala.com" aria-invalid={!!errors.email} {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>

      {/* Role */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Role <span className="text-destructive">*</span>
        </label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full" aria-invalid={!!errors.role}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.role?.message} />
      </div>

      {/* Temp password notice */}
      <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        Temporary password:{" "}
        <span className="font-mono font-medium text-foreground">WelcomeLuilala2026!</span>
        {" "}— user should change on first login.
      </div>

      <DialogFooter showCloseButton>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {mutation.isPending ? "Creating…" : "Create user"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT FORM
// ═══════════════════════════════════════════════════════════════════════════════
function EditUserForm({ user, onClose }: { user: UserDto; onClose: () => void }) {
  const mutation = useUpdateUserMutation()
  const { user: me } = useAuthStore()
  const isSelf = me?.id === user.id

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: user.name, email: user.email, role: user.role, isActive: user.isActive },
    mode: "onTouched",
  })

  const isActive = watch("isActive")

  function onSubmit(values: EditFormValues) {
    mutation.mutate({ id: user.id, dto: values }, { onSuccess: onClose })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="eu-name" className="text-sm font-medium">
          Full name <span className="text-destructive">*</span>
        </label>
        <Input id="eu-name" aria-invalid={!!errors.name} {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="eu-email" className="text-sm font-medium">
          Email address <span className="text-destructive">*</span>
        </label>
        <Input id="eu-email" type="email" aria-invalid={!!errors.email} {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>

      {/* Role */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Role</label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={isSelf}>
              <SelectTrigger className="w-full" aria-invalid={!!errors.role}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        />
        {isSelf && <p className="text-xs text-muted-foreground">You cannot change your own role.</p>}
        <FieldError message={errors.role?.message} />
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Account active</p>
          <p className="text-xs text-muted-foreground mt-0.5">Inactive users cannot log in.</p>
        </div>
        <button
          type="button"
          onClick={() => !isSelf && setValue("isActive", !isActive, { shouldValidate: true })}
          disabled={isSelf}
          aria-label="Toggle active"
          className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isActive
            ? <ToggleRight className="size-8 text-primary" />
            : <ToggleLeft className="size-8" />}
        </button>
      </div>
      {isSelf && <p className="text-xs text-muted-foreground -mt-2">You cannot deactivate your own account.</p>}

      <DialogFooter showCloseButton>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {mutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE DIALOG
// ═══════════════════════════════════════════════════════════════════════════════
function DeleteDialog({ user, onClose }: { user: UserDto; onClose: () => void }) {
  const mutation = useDeleteUserMutation()
  const { user: me } = useAuthStore()
  const isSelf = me?.id === user.id

  if (isSelf) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">You cannot delete your own account.</p>
        <DialogFooter showCloseButton />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Permanently delete{" "}
        <span className="font-semibold text-foreground">{user.name}</span>{" "}
        (<span className="font-mono text-xs">{user.email}</span>)?{" "}
        This cannot be undone.
      </p>
      <DialogFooter showCloseButton>
        <Button
          variant="destructive"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(user.id, { onSuccess: onClose })}
        >
          {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {mutation.isPending ? "Deleting…" : "Delete user"}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════
type DialogKind = "edit" | "delete"
interface ActiveDialog { kind: DialogKind; user: UserDto }

export default function UsersPage() {
  const [search,       setSearch]       = React.useState("")
  const [roleFilter,   setRoleFilter]   = React.useState<UserRole | "ALL">("ALL")
  const [activeFilter, setActiveFilter] = React.useState<"ALL" | "active" | "inactive">("ALL")
  const [createOpen,   setCreateOpen]   = React.useState(false)
  const [active,       setActive]       = React.useState<ActiveDialog | null>(null)
  const closeDialog = () => setActive(null)

  const queryParams: ListUsersQuery = {}
  if (roleFilter !== "ALL")        queryParams.role     = roleFilter
  if (activeFilter === "active")   queryParams.isActive = true
  if (activeFilter === "inactive") queryParams.isActive = false

  const { data, isLoading } = useListUsersQuery(queryParams)
  const users = data?.data ?? []

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [users, search])

  const total         = data?.meta.total ?? 0
  const activeCount   = users.filter((u) => u.isActive).length
  const adminCount    = users.filter((u) => u.role === "ADMIN").length
  const inactiveCount = users.filter((u) => !u.isActive).length

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage system accounts, roles and permissions.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button><Plus className="size-4" />New user</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>New user</DialogTitle></DialogHeader>
            <CreateUserForm onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total users"    value={total}         icon={Users}       color="text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" />
        <StatCard label="Active"         value={activeCount}   icon={UserCheck}   color="text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400" />
        <StatCard label="Inactive"       value={inactiveCount} icon={UserX}       color="text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400" />
        <StatCard label="Administrators" value={adminCount}    icon={ShieldCheck} color="text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | "ALL")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as "ALL" | "active" | "inactive")}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {!isLoading && filtered.length === 0 ? (
          <Empty className="border-0 rounded-xl bg-muted/20 min-h-64">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users className="size-4" />
              </EmptyMedia>
              <EmptyTitle>No users found</EmptyTitle>
              <EmptyDescription>
                {search || roleFilter !== "ALL" || activeFilter !== "ALL"
                  ? "No users match your current filters. Try adjusting the search or filters."
                  : "No users yet. Create the first system account to get started."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-3.5" />
                New user
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Customers</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.name} />
                        <div className="min-w-0">
                          <p className="font-medium leading-none truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_CLASS[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                          <span className="size-1.5 rounded-full bg-green-500 inline-block" />Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <span className="size-1.5 rounded-full bg-muted-foreground/50 inline-block" />Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.workload.ownedLeadsCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.workload.ownedCustomersCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.workload.assignedProjectsCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label="Edit user" onClick={() => setActive({ kind: "edit", user })}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label="Delete user"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setActive({ kind: "delete", user })}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {data?.meta.total ?? filtered.length} users
        </p>
      )}

      {/* Unified dialog */}
      <Dialog open={active !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          {active?.kind === "edit" && (
            <>
              <DialogHeader><DialogTitle>Edit user</DialogTitle></DialogHeader>
              <EditUserForm user={active.user} onClose={closeDialog} />
            </>
          )}
          {active?.kind === "delete" && (
            <>
              <DialogHeader><DialogTitle>Delete user</DialogTitle></DialogHeader>
              <DeleteDialog user={active.user} onClose={closeDialog} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
