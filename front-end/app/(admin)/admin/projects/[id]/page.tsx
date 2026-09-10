"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ArrowLeft, Calendar, DollarSign, Users, CheckCircle2, Clock,
  Pencil, Trash2, Plus, Flag, AlertCircle, Building2, Loader2, X,
  FileText, History, MoreVertical, Download,
} from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

import {
  useProjectQuery,
  useUpdateProjectMutation,
  useChangeStageMutation,
  useAddMilestoneMutation,
  useUpdateMilestoneMutation,
  useAssignTeamMemberMutation,
  useUnassignTeamMemberMutation,
  useDeleteProjectMutation,
} from "@/queries/project.queries"
import { useListUsersQuery } from "@/queries/user.queries"
import type { ProjectStage, MilestoneStatus, MilestoneDto } from "@/services/project.service"

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
const MILESTONE_STATUS_CLASS: Record<MilestoneStatus, string> = {
  PENDING:     "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  DONE:        "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
}
const ALL_MILESTONE_STATUSES: MilestoneStatus[] = ["PENDING", "IN_PROGRESS", "DONE"]

function fmtDate(v: string | null | undefined) {
  if (!v) return "—"
  return new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}
function fmtCurrency(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v
  return isNaN(n) ? "$0.00" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

// ── progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-muted-foreground/40"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-sm font-medium w-12 text-right">{pct}%</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════
const stageSchema = z.object({
  newStage: z.enum(["REQUIREMENTS","DESIGN","DEVELOPMENT","TESTING","DEPLOYMENT","LIVE"] as const, {
    error: "Please select a stage.",
  }),
})
type StageFormValues = z.infer<typeof stageSchema>

const milestoneSchema = z.object({
  title:              z.string().min(1, "Title is required."),
  dueDate:            z.string().optional(),
  status:             z.enum(["PENDING","IN_PROGRESS","DONE"] as const).optional(),
  assignedEmployeeId: z.coerce.number().positive().optional().or(z.literal(0)).transform(v => v || undefined),
})
type MilestoneFormValues = z.infer<typeof milestoneSchema>

const assignSchema = z.object({
  employeeId:    z.coerce.number().min(1, "Select a team member."),
  roleOnProject: z.string().optional(),
})
type AssignFormValues = z.infer<typeof assignSchema>

const projectInfoSchema = z.object({
  name:        z.string().min(1, "Project name is required."),
  description: z.string().optional(),
  startDate:   z.string().optional(),
  endDate:     z.string().optional(),
})
type ProjectInfoFormValues = z.infer<typeof projectInfoSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT PROJECT INFO DIALOG
// ═══════════════════════════════════════════════════════════════════════════════
function EditProjectDialog({ projectId, onClose }: { projectId: number; onClose: () => void }) {
  const { data: project } = useProjectQuery(projectId)
  const updateMut = useUpdateProjectMutation()

  const { register, handleSubmit, control, formState: { errors } } = useForm<ProjectInfoFormValues>({
    resolver: zodResolver(projectInfoSchema),
    defaultValues: {
      name:        project?.name ?? "",
      description: project?.description ?? "",
      startDate:   project?.timeline.startDate ? project.timeline.startDate.slice(0, 10) : "",
      endDate:     project?.timeline.endDate   ? project.timeline.endDate.slice(0, 10)   : "",
    },
    mode: "onTouched",
  })

  function onSubmit(v: ProjectInfoFormValues) {
    updateMut.mutate(
      { id: projectId, dto: { name: v.name, description: v.description || undefined, startDate: v.startDate || undefined, endDate: v.endDate || undefined } },
      { onSuccess: onClose },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="p-name" className="text-sm font-medium">Project name <span className="text-destructive">*</span></label>
        <Input id="p-name" placeholder="e.g. Mobile App v2" aria-invalid={!!errors.name} {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="p-desc" className="text-sm font-medium">Description</label>
        <textarea id="p-desc" rows={3} placeholder="Brief project description…"
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
          {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Start date</label>
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
          <label className="text-sm font-medium">End date</label>
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
        <Button type="submit" disabled={updateMut.isPending}>
          {updateMut.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {updateMut.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHANGE STAGE DIALOG
// ═══════════════════════════════════════════════════════════════════════════════
function ChangeStageDialog({ projectId, currentStage, onClose }: { projectId: number; currentStage: ProjectStage; onClose: () => void }) {
  const mutation = useChangeStageMutation()
  const { control, handleSubmit, formState: { errors } } = useForm<StageFormValues>({
    resolver: zodResolver(stageSchema),
    defaultValues: { newStage: currentStage },
    mode: "onTouched",
  })

  function onSubmit(v: StageFormValues) {
    if (v.newStage === currentStage) { onClose(); return }
    mutation.mutate({ id: projectId, dto: { newStage: v.newStage } }, { onSuccess: onClose })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Current:{" "}
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_CLASS[currentStage]}`}>
          {STAGE_LABELS[currentStage]}
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
// ADD MILESTONE DIALOG
// ═══════════════════════════════════════════════════════════════════════════════
function AddMilestoneDialog({ projectId, teamMembers, open, onClose }: {
  projectId: number
  teamMembers: { id: number; name: string; avatarUrl: string | null; role: string }[]
  open: boolean
  onClose: () => void
}) {
  const addMut = useAddMilestoneMutation()
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema) as any,
    defaultValues: { title: "", dueDate: "", assignedEmployeeId: undefined },
    mode: "onTouched",
  })

  function onSubmit(v: MilestoneFormValues) {
    addMut.mutate(
      { id: projectId, dto: {
        title: v.title,
        dueDate: v.dueDate || undefined,
        assignedEmployeeId: v.assignedEmployeeId || undefined,
      }},
      { onSuccess: () => { reset(); onClose() } }
    )
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-muted-foreground"/>
            Add Milestone
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
            <Input placeholder="e.g. Implement login screen" aria-invalid={!!errors.title} {...register("title")} />
            <FieldError message={errors.title?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Due Date</label>
            <Controller control={control} name="dueDate" render={({ field }) => (
              <DatePicker
                value={field.value ? new Date(field.value) : undefined}
                onChange={d => field.onChange(d ? d.toISOString().split("T")[0] : "")}
                placeholder="Select due date"
              />
            )} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Assign to <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
            <Controller control={control} name="assignedEmployeeId" render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={v => field.onChange(v ? Number(v) : undefined)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned">
                    {field.value
                      ? (() => {
                          const m = teamMembers.find(t => t.id === field.value)
                          return m ? (
                            <span className="flex items-center gap-2">
                              <Avatar className="h-5 w-5"><AvatarFallback className="text-[9px]">{m.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback></Avatar>
                              {m.name}
                            </span>
                          ) : "Unassigned"
                        })()
                      : "Unassigned"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {teamMembers.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      <span className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={m.avatarUrl ?? undefined}/>
                          <AvatarFallback className="text-[9px]">{m.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <span>{m.name}</span>
                        <span className="text-xs text-muted-foreground ml-1">{m.role}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={addMut.isPending}>Cancel</Button>
            <Button type="submit" disabled={addMut.isPending}>
              {addMut.isPending && <Loader2 className="size-3.5 animate-spin mr-1"/>}
              {addMut.isPending ? "Adding…" : "Add Milestone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditMilestoneForm({ milestone, teamMembers, onCancel }: {
  milestone: MilestoneDto
  teamMembers: { id: number; name: string; avatarUrl: string | null; role: string }[]
  onCancel: () => void
}) {
  const updateMut = useUpdateMilestoneMutation()
  const { register, handleSubmit, control, formState: { errors } } = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema) as any,
    defaultValues: {
      title:              milestone.title,
      dueDate:            milestone.dueDate ? milestone.dueDate.slice(0, 10) : "",
      status:             milestone.status,
      assignedEmployeeId: milestone.assignedEmployeeId ?? undefined,
    },
    mode: "onTouched",
  })

  function onSubmit(v: MilestoneFormValues) {
    updateMut.mutate(
      { milestoneId: milestone.id, dto: {
        title:              v.title,
        dueDate:            v.dueDate || undefined,
        status:             v.status,
        assignedEmployeeId: v.assignedEmployeeId || null,
      }},
      { onSuccess: onCancel }
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3 rounded-xl border p-4 bg-muted/20">
      <p className="text-sm font-semibold">Edit milestone</p>

      <div className="flex flex-col gap-1">
        <Input placeholder="Title" aria-invalid={!!errors.title} {...register("title")} />
        <FieldError message={errors.title?.message} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Controller control={control} name="dueDate" render={({ field }) => (
          <DatePicker
            value={field.value ? new Date(field.value) : undefined}
            onChange={d => field.onChange(d ? d.toISOString().split("T")[0] : "")}
            placeholder="Due date"
          />
        )} />
        <Controller control={control} name="status" render={({ field }) => (
          <Select value={field.value ?? ""} onValueChange={field.onChange}>
            <SelectTrigger className="w-full">
              <SelectValue>{field.value ? MILESTONE_STATUS_LABELS[field.value] : "Status"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ALL_MILESTONE_STATUSES.map(s => <SelectItem key={s} value={s}>{MILESTONE_STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground font-medium">Assign to</label>
        <Controller control={control} name="assignedEmployeeId" render={({ field }) => (
          <Select
            value={field.value ? String(field.value) : ""}
            onValueChange={v => field.onChange(v ? Number(v) : undefined)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Unassigned">
                {field.value
                  ? (() => {
                      const m = teamMembers.find(t => t.id === field.value)
                      return m ? (
                        <span className="flex items-center gap-2">
                          <Avatar className="h-5 w-5"><AvatarFallback className="text-[9px]">{m.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback></Avatar>
                          {m.name}
                        </span>
                      ) : "Unassigned"
                    })()
                  : "Unassigned"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {teamMembers.map(m => (
                <SelectItem key={m.id} value={String(m.id)}>
                  <span className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={m.avatarUrl ?? undefined}/>
                      <AvatarFallback className="text-[9px]">{m.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    {m.name}
                    <span className="text-xs text-muted-foreground">{m.role}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )} />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={updateMut.isPending}>
          {updateMut.isPending && <Loader2 className="size-3.5 animate-spin mr-1"/>}Save
        </Button>
      </div>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSIGN TEAM MEMBER FORM
// ═══════════════════════════════════════════════════════════════════════════════
function AssignTeamMemberForm({ projectId, assignedIds }: { projectId: number; assignedIds: Set<number> }) {
  const assignMut = useAssignTeamMemberMutation()
  const { data: uData } = useListUsersQuery()
  const allUsers = uData?.data ?? []
  const availableUsers = allUsers.filter((u) => !assignedIds.has(u.id))

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema) as any,
    defaultValues: { employeeId: undefined as unknown as number, roleOnProject: "" },
    mode: "onTouched",
  })

  function onSubmit(v: AssignFormValues) {
    assignMut.mutate(
      { id: projectId, dto: { employeeId: v.employeeId, roleOnProject: v.roleOnProject || undefined } },
      { onSuccess: () => reset() }
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
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
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = parseInt(params.id as string, 10)
  
  const { data: project, isLoading, error } = useProjectQuery(projectId)
  const unassignMut     = useUnassignTeamMemberMutation()
  const updateMilestoneMut = useUpdateMilestoneMutation()
  const deleteMut       = useDeleteProjectMutation()
  
  const [editInfoOpen, setEditInfoOpen] = React.useState(false)
  const [changeStageOpen, setChangeStageOpen] = React.useState(false)
  const [editingMilestoneId, setEditingMilestoneId] = React.useState<number | null>(null)
  const [milestoneFilter, setMilestoneFilter] = React.useState<MilestoneStatus | "ALL">("ALL")
  const [addMilestoneOpen, setAddMilestoneOpen] = React.useState(false)

  const filteredMilestones = React.useMemo(() => {
    let filtered = milestoneFilter === "ALL" 
      ? project?.milestones ?? []
      : (project?.milestones ?? []).filter(m => m.status === milestoneFilter)
    
    // Sort: overdue first, then by due date, then by created date
    return filtered.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [project?.milestones, milestoneFilter])

  if (isLoading) {
    return <ProjectDetailLoading />
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="size-12 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Project not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The project you're looking for doesn't exist or you don't have access to it.</p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/projects" />}>
          <ArrowLeft className="size-4" />
          Back to projects
        </Button>
      </div>
    )
  }

  const assignedIds = new Set(project.team.map(m => m.id))
  const teamMembers = project.assignments.map(a => ({
    id: a.employee.id,
    name: a.employee.name,
    avatarUrl: (a.employee as any).avatarUrl ?? null,
    role: a.employee.role,
  }))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/projects" />}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              className="h-auto p-0 hover:bg-transparent"
              render={<Link href={`/admin/customers/${project.customer.id}`} />}
            >
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Building2 className="size-3.5" />
                {project.customer.companyName}
              </div>
            </Button>
            <span className="text-muted-foreground">•</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_CLASS[project.stage]}`}>
              {STAGE_LABELS[project.stage]}
            </span>
            {project.timeline.isOverdue && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="size-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <MoreVertical className="size-4" />
              Actions
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setChangeStageOpen(true)}>
                <Flag className="size-4" />
                Change Stage
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditInfoOpen(true)}>
                <Pencil className="size-4" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <FileText className="size-4" />
                Generate Report
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="size-4" />
                Export Data
              </DropdownMenuItem>
              <DropdownMenuItem>
                <History className="size-4" />
                View History
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="size-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Flag className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Milestones</p>
                <p className="text-lg font-bold leading-none mt-0.5">{project.progress.milestonesDone}/{project.progress.milestonesTotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-lg font-bold leading-none mt-0.5">{project.progress.percentComplete}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <Users className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Team</p>
                <p className="text-lg font-bold leading-none mt-0.5">{project.team.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                <DollarSign className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Invoiced</p>
                <p className="text-lg font-bold leading-none mt-0.5">{fmtCurrency(project.financials.totalInvoiced)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.description ? (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No description provided.</p>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p className="font-medium mt-0.5">{fmtDate(project.createdAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated</span>
                  <p className="font-medium mt-0.5">{fmtDate(project.updatedAt)}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{project.progress.milestonesDone}/{project.progress.milestonesTotal} milestones completed</span>
                </div>
                <ProgressBar pct={project.progress.percentComplete} />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="py-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{project.milestones.filter(m => m.isOverdue).length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Overdue Tasks</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{project.milestones.filter(m => m.status === "IN_PROGRESS").length}</p>
                  <p className="text-xs text-muted-foreground mt-1">In Progress</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{project.timeline.daysRemaining !== null && project.timeline.daysRemaining >= 0 ? project.timeline.daysRemaining : 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Days Left</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Milestones */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Milestones</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={milestoneFilter} onValueChange={(v) => setMilestoneFilter(v as MilestoneStatus | "ALL")}>
                  <SelectTrigger className="w-36 h-8">
                    <SelectValue>
                      {milestoneFilter === "ALL" ? "All" : MILESTONE_STATUS_LABELS[milestoneFilter]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {ALL_MILESTONE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{MILESTONE_STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="secondary">{filteredMilestones.length}</Badge>
                <Button size="sm" onClick={() => setAddMilestoneOpen(true)}>
                  <Plus className="size-3.5 mr-1" />Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredMilestones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-3">
                  <Flag className="h-10 w-10 opacity-30" />
                  <p className="text-sm">
                    {milestoneFilter === "ALL"
                      ? "No milestones yet. Click \"Add\" to create the first one."
                      : `No ${MILESTONE_STATUS_LABELS[milestoneFilter].toLowerCase()} milestones.`}
                  </p>
                  {milestoneFilter === "ALL" && (
                    <Button size="sm" variant="outline" onClick={() => setAddMilestoneOpen(true)}>
                      <Plus className="size-3.5 mr-1"/>Add Milestone
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMilestones.map((m) => (
                    editingMilestoneId === m.id ? (
                      <EditMilestoneForm key={m.id} milestone={m} teamMembers={teamMembers} onCancel={() => setEditingMilestoneId(null)} />
                    ) : (
                      <div key={m.id} className={`group flex items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40 ${
                        m.isOverdue ? "border-amber-200 bg-amber-50/40 dark:bg-amber-900/10 dark:border-amber-900/30" :
                        m.status === "DONE" ? "border-emerald-200 bg-emerald-50/40 dark:bg-emerald-900/10 dark:border-emerald-900/30" : ""
                      }`}>
                        {/* Status dot */}
                        <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                          m.status === "DONE" ? "bg-emerald-500" :
                          m.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-slate-400"
                        }`}/>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className={`text-sm font-medium truncate ${m.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                              {m.title}
                            </p>
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${MILESTONE_STATUS_CLASS[m.status]}`}>
                              {MILESTONE_STATUS_LABELS[m.status]}
                            </span>
                            {m.isOverdue && (
                              <Badge variant="destructive" className="text-[10px] h-4 px-1">Overdue</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {m.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="size-3"/>
                                {fmtDate(m.dueDate)}
                              </span>
                            )}
                            {m.assignedEmployee && (
                              <span className="flex items-center gap-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={m.assignedEmployee.avatarUrl ?? undefined}/>
                                  <AvatarFallback className="text-[8px]">
                                    {m.assignedEmployee.name.split(" ").map(n=>n[0]).join("")}
                                  </AvatarFallback>
                                </Avatar>
                                {m.assignedEmployee.name}
                              </span>
                            )}
                            {!m.assignedEmployee && (
                              <span className="flex items-center gap-1 text-muted-foreground/60">
                                <Users className="size-3"/>Unassigned
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon-sm" onClick={() => setEditingMilestoneId(m.id)} title="Edit">
                            <Pencil className="size-3"/>
                          </Button>
                          {m.status !== "DONE" && (
                            <Button
                              variant="ghost" size="icon-sm"
                              onClick={() => updateMilestoneMut.mutate({ milestoneId: m.id, dto: { status: "DONE" } })}
                              disabled={updateMilestoneMut.isPending}
                              title="Mark as done"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                            >
                              {updateMilestoneMut.isPending ? <Loader2 className="size-3 animate-spin"/> : <CheckCircle2 className="size-3"/>}
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Start Date</span>
                <span className="font-medium">{fmtDate(project.timeline.startDate)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">End Date</span>
                <span className="font-medium">{fmtDate(project.timeline.endDate)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Days Remaining</span>
                <span className={`font-medium ${project.timeline.daysRemaining && project.timeline.daysRemaining < 0 ? "text-destructive" : ""}`}>
                  {project.timeline.daysRemaining === null ? "—" : project.timeline.daysRemaining < 0 ? `${Math.abs(project.timeline.daysRemaining)} days overdue` : `${project.timeline.daysRemaining} days`}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Financials */}
          <Card>
            <CardHeader>
              <CardTitle>Financials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Invoiced</span>
                <span className="font-medium">{fmtCurrency(project.financials.totalInvoiced)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Expenses</span>
                <span className="font-medium">{fmtCurrency(project.financials.totalExpenses)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Net</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {fmtCurrency(parseFloat(project.financials.totalInvoiced) - parseFloat(project.financials.totalExpenses))}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Team</CardTitle>
              <Badge variant="secondary">{project.team.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.team.length > 0 && (
                <div className="space-y-2">
                  {project.assignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{a.employee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.roleOnProject || a.employee.role}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        disabled={unassignMut.isPending}
                        onClick={() => unassignMut.mutate({ id: projectId, employeeId: a.employee.id })}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm font-medium mb-3">Assign team member</p>
                <AssignTeamMemberForm projectId={projectId} assignedIds={assignedIds} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <AddMilestoneDialog
        projectId={projectId}
        teamMembers={teamMembers}
        open={addMilestoneOpen}
        onClose={() => setAddMilestoneOpen(false)}
      />

      <Dialog open={editInfoOpen} onOpenChange={setEditInfoOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <EditProjectDialog projectId={projectId} onClose={() => setEditInfoOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={changeStageOpen} onOpenChange={setChangeStageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Stage</DialogTitle>
          </DialogHeader>
          <ChangeStageDialog projectId={projectId} currentStage={project.stage} onClose={() => setChangeStageOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProjectDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
