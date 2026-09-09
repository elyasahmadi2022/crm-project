"use client"

import * as React from "react"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus, Search, Pencil, Trash2, Loader2, Layers, CheckCircle2,
  AlertTriangle, Users, ArrowRightLeft, Flag, UserPlus, X, Eye,
} from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { Button }    from "@/components/ui/button"
import { Input }     from "@/components/ui/input"
import { Badge }     from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton }  from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty"

import {
  useListProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useChangeStageMutation,
  useAddMilestoneMutation,
  useUpdateMilestoneMutation,
  useAssignTeamMemberMutation,
  useUnassignTeamMemberMutation,
} from "@/queries/project.queries"
import { useListCustomersQuery } from "@/queries/customer.queries"
import { useListUsersQuery }     from "@/queries/user.queries"
import { useProjectQuery }       from "@/queries/project.queries"
import type { ProjectDto, ProjectStage, MilestoneStatus, ListProjectsQuery } from "@/services/project.service"

// ── constants ─────────────────────────────────────────────────────────────────
const ALL_STAGES: ProjectStage[] = [
  "REQUIREMENTS", "DESIGN", "DEVELOPMENT", "TESTING", "DEPLOYMENT", "LIVE",
]
const STAGE_LABELS: Record<ProjectStage, string> = {
  REQUIREMENTS: "Requirements", DESIGN: "Design", DEVELOPMENT: "Development",
  TESTING: "Testing", DEPLOYMENT: "Deployment", LIVE: "Live",
}
const STAGE_CLASS: Record<ProjectStage, string> = {
  REQUIREMENTS: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  DESIGN:       "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  DEVELOPMENT:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  TESTING:      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  DEPLOYMENT:   "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  LIVE:         "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
}
const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  PENDING: "Pending", IN_PROGRESS: "In Progress", DONE: "Done",
}
const ALL_MILESTONE_STATUSES: MilestoneStatus[] = ["PENDING", "IN_PROGRESS", "DONE"]

function fmtDate(v: string | null | undefined) {
  if (!v) return "—"
  return new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

// ── skeletons ─────────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
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
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${color}`}><Icon className="size-4" /></div>
        <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-bold leading-none mt-0.5">{value}</p></div>
      </CardContent>
    </Card>
  )
}

// ── progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-muted-foreground/40"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════
const projectSchema = z.object({
  name:        z.string().min(1, "Project name is required."),
  customerId:  z.coerce.number().positive().optional().nullable(),
  description: z.string().optional(),
  startDate:   z.string().optional(),
  endDate:     z.string().optional(),
})
type ProjectFormValues = z.infer<typeof projectSchema>

const stageSchema = z.object({
  newStage: z.enum(["REQUIREMENTS","DESIGN","DEVELOPMENT","TESTING","DEPLOYMENT","LIVE"] as const, {
    error: "Please select a stage.",
  }),
})
type StageFormValues = z.infer<typeof stageSchema>

const milestoneSchema = z.object({
  title:   z.string().min(1, "Title is required."),
  dueDate: z.string().optional(),
  status:  z.enum(["PENDING","IN_PROGRESS","DONE"] as const).optional(),
})
type MilestoneFormValues = z.infer<typeof milestoneSchema>

const assignSchema = z.object({
  employeeId:    z.coerce.number().min(1, "Select a team member."),
  roleOnProject: z.string().optional(),
})
type AssignFormValues = z.infer<typeof assignSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT FORM
// ═══════════════════════════════════════════════════════════════════════════════
function ProjectForm({ initial, onClose }: { initial?: ProjectDto; onClose: () => void }) {
  const isEdit       = !!initial
  const createMut    = useCreateProjectMutation()
  const updateMut    = useUpdateProjectMutation()
  const { data: cData } = useListCustomersQuery()
  const customers    = cData?.data ?? []
  const isPending    = createMut.isPending || updateMut.isPending

  const { register, handleSubmit, control, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name:        initial?.name        ?? "",
      customerId:  initial?.customer.id ?? null,
      description: initial?.description ?? "",
      startDate:   initial?.timeline.startDate ? initial.timeline.startDate.slice(0, 10) : "",
      endDate:     initial?.timeline.endDate   ? initial.timeline.endDate.slice(0, 10)   : "",
    },
    mode: "onTouched",
  })

  function onSubmit(v: ProjectFormValues) {
    if (isEdit) {
      updateMut.mutate(
        { id: initial.id, dto: { name: v.name, description: v.description || undefined, startDate: v.startDate || undefined, endDate: v.endDate || undefined } },
        { onSuccess: onClose },
      )
    } else {
      createMut.mutate(
        { customerId: v.customerId ?? null, name: v.name, description: v.description || undefined, startDate: v.startDate || undefined, endDate: v.endDate || undefined },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="p-name" className="text-sm font-medium">Project name <span className="text-destructive">*</span></label>
        <Input id="p-name" placeholder="e.g. Mobile App v2" aria-invalid={!!errors.name} {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      {!isEdit && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Customer <span className="text-muted-foreground font-normal">(optional)</span></label>
          <Controller control={control} name="customerId" render={({ field }) => {
            const selectedCustomer = customers.find(c => c.id === field.value)
            return (
              <Select
                value={field.value ? String(field.value) : "_general"}
                onValueChange={(v) => field.onChange(v === "_general" ? null : Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {selectedCustomer ? selectedCustomer.companyName : "General / No customer"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_general">
                    <span className="text-muted-foreground italic">General / No customer</span>
                  </SelectItem>
                  {customers
                    .filter((c) => c.companyName !== "__GENERAL__")
                    .map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.companyName}</SelectItem>)}
                </SelectContent>
              </Select>
            )
          }} />
          <p className="text-xs text-muted-foreground">Leave as "General" to create an internal project you can assign to a customer later.</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="p-desc" className="text-sm font-medium">Description</label>
        <textarea id="p-desc" rows={3} placeholder="Brief project description…"
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
          {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="p-start" className="text-sm font-medium">Start date</label>
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <DatePicker
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                placeholder="Select start date"
              />
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="p-end" className="text-sm font-medium">End date</label>
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => (
              <DatePicker
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                placeholder="Select end date"
              />
            )}
          />
        </div>
      </div>

      <DialogFooter showCloseButton>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-3.5 animate-spin" />}
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Create project"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE CHANGE DIALOG
// ═══════════════════════════════════════════════════════════════════════════════
function ChangeStageDialog({ project, onClose }: { project: ProjectDto; onClose: () => void }) {
  const mutation = useChangeStageMutation()
  const { control, handleSubmit, formState: { errors } } = useForm<StageFormValues>({
    resolver: zodResolver(stageSchema),
    defaultValues: { newStage: project.stage },
    mode: "onTouched",
  })
  function onSubmit(v: StageFormValues) {
    if (v.newStage === project.stage) { onClose(); return }
    mutation.mutate({ id: project.id, dto: { newStage: v.newStage } }, { onSuccess: onClose })
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Current:{" "}
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_CLASS[project.stage]}`}>
          {STAGE_LABELS[project.stage]}
        </span>
      </p>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">New stage</label>
        <Controller control={control} name="newStage" render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="w-full" aria-invalid={!!errors.newStage}>
              <SelectValue>
                {field.value ? STAGE_LABELS[field.value] : "Select stage"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ALL_STAGES.map((s) => <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
        <FieldError message={errors.newStage?.message} />
      </div>
      <DialogFooter showCloseButton>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {mutation.isPending ? "Updating…" : "Update stage"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MILESTONES DIALOG
// ═══════════════════════════════════════════════════════════════════════════════
function MilestonesDialog({ project, onClose }: { project: ProjectDto; onClose: () => void }) {
  const { data: detail, isLoading } = useProjectQuery(project.id)
  const addMut    = useAddMilestoneMutation()
  const updateMut = useUpdateMilestoneMutation()
  const [editingId, setEditingId] = React.useState<number | null>(null)

  const { register: regAdd, handleSubmit: hsAdd, control: ctrlAdd, reset: resetAdd, formState: { errors: addErrors } } = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema), defaultValues: { title: "", dueDate: "" }, mode: "onTouched",
  })
  const { register: regEdit, handleSubmit: hsEdit, control: ctrlEdit, reset: resetEdit, formState: { errors: editErrors } } = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema), defaultValues: { title: "", dueDate: "", status: "PENDING" }, mode: "onTouched",
  })

  function onAdd(v: MilestoneFormValues) {
    addMut.mutate({ id: project.id, dto: { title: v.title, dueDate: v.dueDate || undefined } }, {
      onSuccess: () => resetAdd(),
    })
  }
  function startEdit(m: { id: number; title: string; dueDate: string | null; status: MilestoneStatus }) {
    setEditingId(m.id)
    resetEdit({ title: m.title, dueDate: m.dueDate ? m.dueDate.slice(0, 10) : "", status: m.status })
  }
  function onEdit(v: MilestoneFormValues) {
    if (!editingId) return
    updateMut.mutate({ milestoneId: editingId, dto: { title: v.title, dueDate: v.dueDate || undefined, status: v.status } }, {
      onSuccess: () => setEditingId(null),
    })
  }

  // Milestones aren't in the list response — we fetch the detail record
  // The detail endpoint returns the full project including milestones
  // but our DTO doesn't include them in the list. We re-use useProjectQuery.
  // Since milestones aren't in ProjectDto we show the progress counts instead
  // and allow adding new ones. The refresh will update the progress bar.

  return (
    <div className="flex flex-col gap-5">
      {/* Progress summary */}
      <div className="rounded-lg border bg-muted/30 p-3 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">Progress</p>
          <ProgressBar pct={project.progress.percentComplete} />
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold leading-none">{project.progress.milestonesDone}/{project.progress.milestonesTotal}</p>
          <p className="text-xs text-muted-foreground">done</p>
        </div>
      </div>

      <Separator />

      {/* Add new milestone */}
      <form onSubmit={hsAdd(onAdd)} noValidate className="flex flex-col gap-3">
        <p className="text-sm font-medium">Add milestone</p>
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <Input placeholder="Milestone title" aria-invalid={!!addErrors.title} {...regAdd("title")} />
            <FieldError message={addErrors.title?.message} />
          </div>
          <Controller
            control={ctrlAdd}
            name="dueDate"
            render={({ field }) => (
              <DatePicker
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                placeholder="Due date"
                className="w-40 shrink-0"
              />
            )}
          />
          <Button type="submit" size="sm" disabled={addMut.isPending}>
            {addMut.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          </Button>
        </div>
      </form>

      {/* Edit existing milestone */}
      {editingId !== null && (
        <form onSubmit={hsEdit(onEdit)} noValidate className="flex flex-col gap-3 rounded-lg border p-3 bg-muted/20">
          <p className="text-sm font-medium">Edit milestone</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Input placeholder="Title" aria-invalid={!!editErrors.title} {...regEdit("title")} />
              <FieldError message={editErrors.title?.message} />
            </div>
            <Controller
              control={ctrlEdit}
              name="dueDate"
              render={({ field }) => (
                <DatePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                  placeholder="Due date"
                />
              )}
            />
          </div>
          <Controller control={ctrlEdit} name="status" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {field.value ? MILESTONE_STATUS_LABELS[field.value] : "Select status"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ALL_MILESTONE_STATUSES.map((s) => <SelectItem key={s} value={s}>{MILESTONE_STATUS_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={updateMut.isPending}>
              {updateMut.isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Save"}
            </Button>
          </div>
        </form>
      )}

      <DialogFooter showCloseButton />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM DIALOG
// ═══════════════════════════════════════════════════════════════════════════════
function TeamDialog({ project, onClose }: { project: ProjectDto; onClose: () => void }) {
  const assignMut   = useAssignTeamMemberMutation()
  const unassignMut = useUnassignTeamMemberMutation()
  const { data: uData } = useListUsersQuery()
  const allUsers = uData?.data ?? []
  const assignedIds = new Set(project.team.map((m) => m.id))
  const availableUsers = allUsers.filter((u) => !assignedIds.has(u.id))

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { employeeId: undefined as unknown as number, roleOnProject: "" },
    mode: "onTouched",
  })

  function onAssign(v: AssignFormValues) {
    assignMut.mutate(
      { id: project.id, dto: { employeeId: v.employeeId, roleOnProject: v.roleOnProject || undefined } },
      { onSuccess: () => reset() },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Current team */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Current team ({project.team.length})</p>
        {project.team.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members assigned.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {project.team.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
                <Button variant="ghost" size="icon-sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={unassignMut.isPending}
                  onClick={() => unassignMut.mutate({ id: project.id, employeeId: m.id })}>
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Assign new member */}
      <form onSubmit={handleSubmit(onAssign)} noValidate className="flex flex-col gap-3">
        <p className="text-sm font-medium">Assign team member</p>
        <div className="flex flex-col gap-1">
          <Controller control={control} name="employeeId" render={({ field }) => {
            const selectedUser = allUsers.find(u => u.id === field.value)
            return (
              <Select value={field.value ? String(field.value) : ""} onValueChange={(v) => field.onChange(Number(v))}>
                <SelectTrigger className="w-full" aria-invalid={!!errors.employeeId}>
                  <SelectValue>
                    {selectedUser ? `${selectedUser.name} — ${selectedUser.role}` : "Select user"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0
                    ? <SelectItem value="_none" disabled>All users are assigned</SelectItem>
                    : availableUsers.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.name} — {u.role}</SelectItem>)
                  }
                </SelectContent>
              </Select>
            )
          }} />
          <FieldError message={errors.employeeId?.message} />
        </div>
        <Input placeholder="Role on project (optional)" {...register("roleOnProject")} />
        <Button type="submit" size="sm" disabled={assignMut.isPending || availableUsers.length === 0}>
          {assignMut.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {assignMut.isPending ? "Assigning…" : "Assign"}
        </Button>
      </form>

      <DialogFooter showCloseButton />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════
type DialogKind = "edit" | "stage" | "milestones" | "team"
interface ActiveDialog { kind: DialogKind; project: ProjectDto }

export default function ProjectsPage() {
  const [search,      setSearch]      = React.useState("")
  const [stageFilter, setStageFilter] = React.useState<ProjectStage | "ALL">("ALL")
  const [createOpen,  setCreateOpen]  = React.useState(false)
  const [active,      setActive]      = React.useState<ActiveDialog | null>(null)
  const closeDialog = () => setActive(null)

  const queryParams: ListProjectsQuery = {}
  if (stageFilter !== "ALL") queryParams.stage = stageFilter

  const { data, isLoading } = useListProjectsQuery(queryParams)
  const projects = data?.data ?? []

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.customer.companyName.toLowerCase().includes(q),
    )
  }, [projects, search])

  const total    = data?.meta.total ?? 0
  const liveCount    = projects.filter((p) => p.stage === "LIVE").length
  const overdueCount = projects.filter((p) => p.timeline.isOverdue).length
  const avgPct   = projects.length
    ? Math.round(projects.reduce((s, p) => s + p.progress.percentComplete, 0) / projects.length)
    : 0

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track all customer projects, milestones and team assignments.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button><Plus className="size-4" />New project</Button>} />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader>
            <ProjectForm onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total projects"   value={total}         icon={Layers}         color="text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" />
        <StatCard label="Live"             value={liveCount}     icon={CheckCircle2}   color="text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400" />
        <StatCard label="Overdue"          value={overdueCount}  icon={AlertTriangle}  color="text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400" />
        <StatCard label="Avg. progress"    value={`${avgPct}%`}  icon={Flag}           color="text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Search by name or customer…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as ProjectStage | "ALL")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All stages</SelectItem>
            {ALL_STAGES.map((s) => <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {!isLoading && filtered.length === 0 ? (
          <Empty className="border-0 bg-muted/20 min-h-64">
            <EmptyHeader>
              <EmptyMedia variant="icon"><Layers className="size-4" /></EmptyMedia>
              <EmptyTitle>No projects found</EmptyTitle>
              <EmptyDescription>
                {search || stageFilter !== "ALL"
                  ? "No projects match your current filters."
                  : "No projects yet. Create your first project to get started."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="size-3.5" />New project</Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Invoiced</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium leading-none">{p.name}</p>
                        {p.description && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-48">{p.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.customer.companyName}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_CLASS[p.stage]}`}>
                        {STAGE_LABELS[p.stage]}
                      </span>
                    </TableCell>
                    <TableCell className="min-w-32">
                      <ProgressBar pct={p.progress.percentComplete} />
                      <p className="text-xs text-muted-foreground mt-0.5">{p.progress.milestonesDone}/{p.progress.milestonesTotal} milestones</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex -space-x-1.5">
                        {p.team.slice(0, 4).map((m) => (
                          <span key={m.id} title={m.name}
                            className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-sidebar-primary text-sidebar-primary-foreground text-[10px] font-bold">
                            {m.name.charAt(0).toUpperCase()}
                          </span>
                        ))}
                        {p.team.length > 4 && (
                          <span className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-bold text-muted-foreground">
                            +{p.team.length - 4}
                          </span>
                        )}
                        {p.team.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p className="text-muted-foreground">{fmtDate(p.timeline.startDate)} → {fmtDate(p.timeline.endDate)}</p>
                        {p.timeline.isOverdue && (
                          <span className="text-destructive font-medium flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="size-3" /> Overdue
                          </span>
                        )}
                        {!p.timeline.isOverdue && p.timeline.daysRemaining !== null && p.stage !== "LIVE" && (
                          <span className="text-muted-foreground">{p.timeline.daysRemaining}d left</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      ${parseFloat(p.financials.totalInvoiced).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="View details"
                          title="View details"
                          nativeButton={false}
                          render={<Link href={`/admin/projects/${p.id}`} />}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label="Edit" title="Edit project" onClick={() => setActive({ kind: "edit", project: p })}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label="Change stage" title="Change stage" onClick={() => setActive({ kind: "stage", project: p })}>
                          <ArrowRightLeft className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label="Milestones" title="Milestones" onClick={() => setActive({ kind: "milestones", project: p })}>
                          <Flag className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label="Team" title="Manage team" onClick={() => setActive({ kind: "team", project: p })}>
                          <Users className="size-3.5" />
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
          Showing {filtered.length} of {data?.meta.total ?? filtered.length} projects
        </p>
      )}

      {/* Unified dialog */}
      <Dialog open={active !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-lg">
          {active?.kind === "edit" && (
            <><DialogHeader><DialogTitle>Edit project</DialogTitle></DialogHeader>
              <ProjectForm initial={active.project} onClose={closeDialog} /></>
          )}
          {active?.kind === "stage" && (
            <><DialogHeader><DialogTitle>Change stage — {active.project.name}</DialogTitle></DialogHeader>
              <ChangeStageDialog project={active.project} onClose={closeDialog} /></>
          )}
          {active?.kind === "milestones" && (
            <><DialogHeader><DialogTitle>Milestones — {active.project.name}</DialogTitle></DialogHeader>
              <MilestonesDialog project={active.project} onClose={closeDialog} /></>
          )}
          {active?.kind === "team" && (
            <><DialogHeader><DialogTitle>Team — {active.project.name}</DialogTitle></DialogHeader>
              <TeamDialog project={active.project} onClose={closeDialog} /></>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
