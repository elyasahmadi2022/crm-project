"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Briefcase, CheckCircle2, Clock, AlertCircle, Users, Calendar,
  ChevronRight, Flag, Circle, Loader2, User, ArrowUpRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/lib/toast"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"

// ─── constants ────────────────────────────────────────────────────────
const MS = {
  PENDING:     { label: "Pending",     dot: "bg-slate-400",   ring: "border-slate-200",   pill: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  IN_PROGRESS: { label: "In Progress", dot: "bg-blue-500",    ring: "border-blue-200",    pill: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  COMPLETED:   { label: "Completed",   dot: "bg-emerald-500", ring: "border-emerald-200", pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  DONE:        { label: "Done",        dot: "bg-emerald-500", ring: "border-emerald-200", pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  BLOCKED:     { label: "Blocked",     dot: "bg-red-500",     ring: "border-red-200",     pill: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
} as Record<string, { label: string; dot: string; ring: string; pill: string }>

const STAGE = {
  REQUIREMENTS: { label: "Requirements", color: "bg-slate-500" },
  DESIGN:        { label: "Design",        color: "bg-purple-500" },
  DEVELOPMENT:   { label: "Development",   color: "bg-blue-500" },
  TESTING:       { label: "Testing",       color: "bg-amber-500" },
  DEPLOYMENT:    { label: "Deployment",    color: "bg-orange-500" },
  LIVE:          { label: "Live",          color: "bg-emerald-500" },
  ON_HOLD:       { label: "On Hold",       color: "bg-slate-400" },
  CANCELLED:     { label: "Cancelled",     color: "bg-red-500" },
} as Record<string, { label: string; color: string }>

const MILESTONE_STATUSES = ["PENDING","IN_PROGRESS","COMPLETED","BLOCKED"]

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

// ─── components ───────────────────────────────────────────────────────
function MilestonePill({ status }: { status: string }) {
  const s = MS[status] ?? MS.PENDING
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function StageBadge({ stage }: { stage: string }) {
  const s = STAGE[stage] ?? { label: stage, color: "bg-slate-400" }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white ${s.color}`}>
      {s.label}
    </span>
  )
}

// ─── page ─────────────────────────────────────────────────────────────
export default function MyProjectsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const [selected, setSelected]   = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newStatus, setNewStatus]  = useState("")
  const [notes, setNotes]          = useState("")
  const [expandedProject, setExpandedProject] = useState<number | null>(null)

  // ── data ──────────────────────────────────────────────────────────
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["my-projects", user?.id],
    queryFn: async () => {
      const r = await api.get("/projects", { params: { assignedEmployeeId: user!.id } })
      const raw = r.data.data ?? r.data
      return Array.isArray(raw) ? raw : (raw.data ?? [])
    },
    enabled: !!user,
  })

  // ── mutation ──────────────────────────────────────────────────────
  const updateMilestone = useMutation({
    mutationFn: () => api.put(`/projects/milestones/${selected.id}`, {
      status:      newStatus || undefined,
      notes:       notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-projects"] })
      toast.success("Milestone updated")
      setDialogOpen(false)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update"),
  })

  function openMilestone(m: any) {
    setSelected(m)
    setNewStatus(m.status)
    setNotes("")
    setDialogOpen(true)
  }

  // ── stats ─────────────────────────────────────────────────────────
  const allMs      = projects.flatMap((p: any) => p.milestones ?? [])
  const myMs       = allMs.filter((m: any) => m.assignedEmployee?.id === user?.id)
  const doneMiles  = allMs.filter((m: any) => ["COMPLETED","DONE"].includes(m.status)).length
  const blockedMs  = allMs.filter((m: any) => m.status === "BLOCKED").length
  const activeProj = projects.filter((p: any) => !["LIVE","CANCELLED"].includes(p.stage ?? "")).length

  return (
    <div className="container mx-auto py-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Projects</h1>
        <p className="text-muted-foreground mt-1">Your assigned projects and milestone progress</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: "Active Projects",  value: activeProj,       icon: Briefcase,    color: "text-blue-600" },
          { label: "My Milestones",    value: myMs.length,      icon: Flag,         color: "text-purple-600" },
          { label: "Completed",        value: doneMiles,         icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Blocked",          value: blockedMs,         icon: AlertCircle,  color: "text-red-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="overflow-hidden">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="p-2.5 rounded-xl bg-muted shrink-0">
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className={`text-2xl font-bold leading-none mt-0.5 ${color}`}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Projects */}
      {isLoading ? (
        <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl"/>)}</div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Briefcase className="h-6 w-6 opacity-40" />
            </div>
            <p className="text-sm">No projects assigned to you yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project: any) => {
            const milestones     = project.milestones ?? []
            const completedCount = milestones.filter((m: any) => ["COMPLETED","DONE"].includes(m.status)).length
            const rawProgress    = project.progress
            const fallback       = rawProgress && typeof rawProgress === "object"
              ? (rawProgress.percentComplete ?? 0) : (rawProgress ?? 0)
            const prog = milestones.length > 0
              ? Math.round((completedCount / milestones.length) * 100)
              : fallback
            const isExpanded = expandedProject === project.id
            const myMilestones  = milestones.filter((m: any) => m.assignedEmployee?.id === user?.id)
            const allMilestones = milestones.filter((m: any) => !m.assignedEmployee || m.assignedEmployee.id !== user?.id)

            return (
              <Card key={project.id} className="overflow-hidden border-l-4" style={{
                borderLeftColor: STAGE[project.stage ?? ""]?.color?.replace("bg-","") ?? "#6b7280",
              }}>
                <div className="border-l-4 border-transparent">
                  {/* Project header */}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <StageBadge stage={project.stage ?? "REQUIREMENTS"} />
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {project.customer && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3"/>
                              {project.customer.companyName ?? project.customer.name}
                            </span>
                          )}
                          {project.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3"/>
                              {new Date(project.startDate).toLocaleDateString()} –{" "}
                              {project.endDate ? new Date(project.endDate).toLocaleDateString() : "TBD"}
                            </span>
                          )}
                          {project.assignments?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3"/>
                              {project.assignments.length} team member{project.assignments.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs shrink-0"
                        onClick={() => setExpandedProject(isExpanded ? null : project.id)}>
                        {isExpanded ? "Collapse" : "View Milestones"}
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}/>
                      </Button>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{completedCount} of {milestones.length} milestones</span>
                        <span className="font-semibold">{prog}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${prog}%` }}
                        />
                      </div>
                    </div>
                  </CardHeader>

                  {/* Milestones panel */}
                  {isExpanded && milestones.length > 0 && (
                    <CardContent className="pt-0 space-y-4">
                      <Separator />

                      {/* My assigned milestones */}
                      {myMilestones.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <User className="h-3 w-3"/> Assigned to me
                          </p>
                          <div className="space-y-2">
                            {myMilestones.map((m: any) => (
                              <MilestoneRow key={m.id} m={m} onUpdate={openMilestone} mine />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* All other milestones */}
                      {allMilestones.length > 0 && (
                        <div className="space-y-2">
                          {myMilestones.length > 0 && (
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              All Milestones
                            </p>
                          )}
                          <div className="space-y-2">
                            {allMilestones.map((m: any) => (
                              <MilestoneRow key={m.id} m={m} onUpdate={openMilestone} />
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}

                  {isExpanded && milestones.length === 0 && (
                    <CardContent className="pt-0">
                      <Separator className="mb-4"/>
                      <p className="text-sm text-center text-muted-foreground py-4">No milestones added yet.</p>
                    </CardContent>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Update milestone dialog ─────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-muted-foreground"/>
              Update Milestone
            </DialogTitle>
            {selected && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{selected.title}</p>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Current status pill */}
            {selected && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted">
                <span className="text-xs text-muted-foreground">Current:</span>
                <MilestonePill status={selected.status}/>
                {selected.dueDate && (
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3"/>
                    {new Date(selected.dueDate).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
                  </span>
                )}
              </div>
            )}

            {/* Status selector — visual cards */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">New Status</Label>
              <div className="grid grid-cols-2 gap-2">
                {MILESTONE_STATUSES.map(s => {
                  const info = MS[s]
                  const active = newStatus === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewStatus(s)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        active
                          ? `${info.ring} bg-muted shadow-sm`
                          : "border-transparent hover:border-muted bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${info.dot}`}/>
                      {info.label}
                      {active && <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-emerald-600"/>}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Progress notes <span className="normal-case font-normal">(optional)</span>
              </Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="What did you complete? Any blockers or updates?"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}
              disabled={updateMilestone.isPending}>Cancel</Button>
            <Button onClick={() => updateMilestone.mutate()}
              disabled={updateMilestone.isPending || !newStatus}
              className="min-w-[100px]">
              {updateMilestone.isPending
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Saving…</>
                : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── milestone row sub-component ──────────────────────────────────────
function MilestoneRow({ m, onUpdate, mine = false }: {
  m: any; onUpdate: (m: any) => void; mine?: boolean
}) {
  const isDone    = ["COMPLETED","DONE"].includes(m.status)
  const isBlocked = m.status === "BLOCKED"
  const isOverdue = m.isOverdue

  return (
    <div className={`group flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${
      isDone    ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30" :
      isBlocked ? "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30" :
      isOverdue ? "bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30" :
      mine      ? "bg-purple-50/60 border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/30" :
                  "bg-muted/30 border-transparent hover:border-border/60"
    }`}>
      {/* Status dot */}
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${(MS[m.status] ?? MS.PENDING).dot}`}/>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isDone ? "line-through text-muted-foreground" : ""}`}>
          {m.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {m.dueDate && (
            <span className={`flex items-center gap-0.5 text-xs ${isOverdue && !isDone ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
              <Calendar className="h-2.5 w-2.5"/>
              {new Date(m.dueDate).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
              {isOverdue && !isDone && " · Overdue"}
            </span>
          )}
          {m.assignedEmployee && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Avatar className="h-3.5 w-3.5">
                <AvatarImage src={m.assignedEmployee.avatarUrl}/>
                <AvatarFallback className="text-[8px]">
                  {m.assignedEmployee.name.split(" ").map((n: string) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              {m.assignedEmployee.name}
            </span>
          )}
        </div>
      </div>

      {/* Status pill */}
      <MilestonePill status={m.status}/>

      {/* Update button */}
      {!isDone && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={() => onUpdate(m)}
        >
          <ArrowUpRight className="h-3.5 w-3.5 mr-1"/>Update
        </Button>
      )}
    </div>
  )
}
