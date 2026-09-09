"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Briefcase, CheckCircle, Clock, AlertCircle, Users, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/lib/toast"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"

const MILESTONE_STATUSES = [
  { value: "PENDING",     label: "Pending",     color: "bg-gray-400" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-500" },
  { value: "COMPLETED",   label: "Completed",   color: "bg-green-500" },
  { value: "BLOCKED",     label: "Blocked",     color: "bg-red-500" },
]

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "COMPLETED":   return <Badge className="bg-green-600">Completed</Badge>
    case "IN_PROGRESS": return <Badge className="bg-blue-600">In Progress</Badge>
    case "PENDING":     return <Badge variant="secondary">Pending</Badge>
    case "BLOCKED":     return <Badge variant="destructive">Blocked</Badge>
    case "ON_HOLD":     return <Badge variant="outline">On Hold</Badge>
    default:            return <Badge variant="outline">{status}</Badge>
  }
}

export default function MyProjectsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const [milestoneDialog, setMilestoneDialog] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [milestoneStatus, setMilestoneStatus] = useState("")
  const [milestoneNotes, setMilestoneNotes]   = useState("")

  // ── Fetch only projects assigned to the logged-in user ─────────────
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["my-projects", user?.id],
    queryFn: async () => {
      const r = await api.get("/projects", {
        params: { assignedEmployeeId: user!.id },
      })
      const raw = r.data.data ?? r.data
      // Handle paginated response
      return Array.isArray(raw) ? raw : (raw.data ?? [])
    },
    enabled: !!user,
  })

  // ── Update milestone ───────────────────────────────────────────────
  const updateMilestone = useMutation({
    mutationFn: async () => {
      await api.put(`/projects/milestones/${selected.id}`, {
        status: milestoneStatus,
        notes: milestoneNotes || undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-projects"] })
      toast.success("Milestone updated")
      setMilestoneDialog(false)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update milestone"),
  })

  const openMilestoneDialog = (milestone: any) => {
    setSelected(milestone)
    setMilestoneStatus(milestone.status)
    setMilestoneNotes("")
    setMilestoneDialog(true)
  }

  // ── Stats ──────────────────────────────────────────────────────────
  const allMilestones  = projects.flatMap((p: any) => p.milestones ?? [])
  const completed      = allMilestones.filter((m: any) => m.status === "COMPLETED").length
  const dueSoon = allMilestones.filter((m: any) => {
    if (m.status === "COMPLETED") return false
    const due = new Date(m.dueDate)
    const now = new Date()
    const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 30
  }).length

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Projects</h1>
        <p className="text-muted-foreground mt-1">Your assigned projects and milestone progress</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Currently assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Month</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dueSoon}</div>
            <p className="text-xs text-muted-foreground">Milestones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completed}</div>
            <p className="text-xs text-muted-foreground">Milestones done</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects list */}
      {isLoading ? (
        <div className="space-y-4">{[1,2].map(i=><Skeleton key={i} className="h-64 w-full" />)}</div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p>No projects assigned to you yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {projects.map((project: any) => {
            const milestones = project.milestones ?? []
            const completedCount = milestones.filter((m: any) => m.status === "COMPLETED").length
            const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : project.progress ?? 0

            return (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="flex items-center gap-3 mt-1 flex-wrap">
                        {project.customer && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> {project.customer.companyName ?? project.customer.name}
                          </span>
                        )}
                        {project.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(project.startDate).toLocaleDateString()} – {project.endDate ? new Date(project.endDate).toLocaleDateString() : "TBD"}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <StatusBadge status={project.stage ?? project.status ?? "IN_PROGRESS"} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    {milestones.length > 0 && (
                      <p className="text-xs text-muted-foreground">{completedCount} of {milestones.length} milestones completed</p>
                    )}
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  )}

                  {/* Milestones */}
                  {milestones.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Milestones</h4>
                      <div className="space-y-2">
                        {milestones.map((m: any) => {
                          const statusInfo = MILESTONE_STATUSES.find(s => s.value === m.status)
                          return (
                            <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/40 transition-colors">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${statusInfo?.color ?? "bg-gray-400"}`} />
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{m.title}</p>
                                  {m.dueDate && (
                                    <p className="text-xs text-muted-foreground">
                                      Due: {new Date(m.dueDate).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <StatusBadge status={m.status} />
                                <Button size="sm" variant="outline" onClick={() => openMilestoneDialog(m)}>
                                  Update
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Team */}
                  {(project.assignments?.length > 0) && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Team</p>
                      <div className="flex flex-wrap gap-2">
                        {project.assignments.map((a: any) => (
                          <Badge key={a.id} variant="outline" className="text-xs">
                            {a.employee?.name ?? `Employee #${a.employeeId}`}
                            {a.roleOnProject && ` · ${a.roleOnProject}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Milestone update dialog */}
      <Dialog open={milestoneDialog} onOpenChange={setMilestoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Milestone</DialogTitle>
            <DialogDescription>{selected?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={milestoneStatus || undefined} onValueChange={v => v && setMilestoneStatus(v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MILESTONE_STATUSES.map(s=>(
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={milestoneNotes}
                onChange={e => setMilestoneNotes(e.target.value)}
                placeholder="Progress notes, blockers, or comments..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMilestoneDialog(false)} disabled={updateMilestone.isPending}>Cancel</Button>
            <Button onClick={() => updateMilestone.mutate()} disabled={updateMilestone.isPending}>
              {updateMilestone.isPending ? "Saving…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
