"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus, FileText, Calendar, AlertCircle, Clock,
  Edit, Eye, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Timer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/lib/toast"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"

// ── Constants ────────────────────────────────────────────────────────
const REPORT_TYPES = [
  { value: "DAILY",   label: "Daily Report",   maxPerDay: 1 },
  { value: "WEEKLY",  label: "Weekly Report",  maxPerDay: 2 },
  { value: "MONTHLY", label: "Monthly Report", maxPerDay: 3 },
]
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
const PAGE_SIZE = 5

// ── Helpers ──────────────────────────────────────────────────────────
function thisMonday() {
  const d = new Date(); d.setHours(0,0,0,0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}
function isTodayStr(ds: string) {
  return new Date(ds).toDateString() === new Date().toDateString()
}
function parseContent(content: string) {
  const topic = content.match(/^Topic: (.+)/m)?.[1] ?? content.split("\n")[0] ?? ""
  const time  = content.match(/^Time: (.+)/m)?.[1] ?? ""
  const desc  = content.replace(/^Topic:.*\n?/m,"").replace(/^Time:.*\n?/m,"").replace(/^\n+/,"").trim()
  return { topic, time, desc }
}
function parseMinutes(timeStr: string): number {
  // "HH:MM" → minutes since midnight
  const [h, m] = timeStr.split(":").map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}
function minutesToHours(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function MyReportsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const now = new Date()

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen,   setEditOpen]   = useState(false)
  const [viewOpen,   setViewOpen]   = useState(false)
  const [selected,   setSelected]   = useState<any>(null)
  const [page, setPage]             = useState(1)
  const [form, setForm] = useState({ type: "DAILY", topic: "", startTime: "", endTime: "", description: "" })
  const resetForm = () => setForm({ type:"DAILY", topic:"", startTime:"", endTime:"", description:"" })

  // ── Data ─────────────────────────────────────────────────────────
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["my-reports", now.getFullYear(), now.getMonth()],
    queryFn: async () => {
      const r = await api.get("/reports", { params: { year: now.getFullYear(), month: now.getMonth() + 1 } })
      return (r.data.data ?? r.data) as any[]
    },
    enabled: !!user,
  })

  const { data: summary } = useQuery({
    queryKey: ["my-monthly-summary", user?.id, now.getFullYear(), now.getMonth() + 1],
    queryFn: async () => {
      const r = await api.get(`/reports/employee/${user!.id}/monthly/${now.getFullYear()}/${now.getMonth() + 1}`)
      return r.data.data ?? r.data
    },
    enabled: !!user,
  })

  // ── Computed stats ───────────────────────────────────────────────
  const totalMinutes = useMemo(() => {
    return reports.reduce((acc: number, r: any) => {
      const { time } = parseContent(r.content ?? "")
      if (!time) return acc
      const [startStr, endStr] = time.split("–").map((s: string) => s.trim())
      if (!startStr || !endStr) return acc
      const diff = parseMinutes(endStr) - parseMinutes(startStr)
      return acc + (diff > 0 ? diff : 0)
    }, 0)
  }, [reports])

  // Map: date → reports[] (for duplicate checking)
  const reportsByDate = useMemo(() => {
    const map = new Map<string, any[]>()
    reports.forEach((r: any) => {
      const ds = r.reportDate?.split("T")[0] ?? ""
      if (!map.has(ds)) map.set(ds, [])
      map.get(ds)!.push(r)
    })
    return map
  }, [reports])

  // Can write today: check per-type limits
  const todayStr = now.toISOString().split("T")[0]!
  const todayReports = reportsByDate.get(todayStr) ?? []
  const todayTypeCount = (type: string) => todayReports.filter((r: any) => r.type === type).length
  const maxForType = (type: string) => REPORT_TYPES.find(t => t.value === type)?.maxPerDay ?? 1
  const canSubmit = maxForType(form.type) > todayTypeCount(form.type)

  // ── Create ──────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const content = `Topic: ${data.topic}\nTime: ${data.startTime} – ${data.endTime}\n\n${data.description}`
      await api.post("/reports", { reportDate: todayStr, type: data.type, content })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-reports"] })
      qc.invalidateQueries({ queryKey: ["my-monthly-summary"] })
      toast.success("Report submitted")
      setCreateOpen(false); resetForm()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to submit report"),
  })

  // ── Update ──────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const content = `Topic: ${data.topic}\nTime: ${data.startTime} – ${data.endTime}\n\n${data.description}`
      await api.put(`/reports/${selected.id}`, { content })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-reports"] })
      toast.success("Report updated")
      setEditOpen(false); resetForm()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update report"),
  })

  const handleSubmit = () => {
    if (!form.topic.trim() || !form.description.trim() || !form.startTime || !form.endTime) {
      toast.error("Please fill in all required fields"); return
    }
    if (!canSubmit) {
      toast.error(`You have already submitted the maximum ${maxForType(form.type)} ${form.type.toLowerCase()} report(s) for today`)
      return
    }
    createMutation.mutate(form)
  }

  const handleUpdate = () => {
    if (!form.topic.trim() || !form.description.trim() || !form.startTime || !form.endTime) {
      toast.error("Please fill in all required fields"); return
    }
    updateMutation.mutate(form)
  }

  const openEdit = (report: any) => {
    if (!isTodayStr(report.reportDate)) { toast.error("You can only edit today's reports"); return }
    const { topic, time, desc } = parseContent(report.content ?? "")
    const [start, end] = time.split("–").map((s: string) => s.trim())
    setSelected(report)
    setForm({ type: report.type, topic, startTime: start ?? "", endTime: end ?? "", description: desc })
    setEditOpen(true)
  }

  // ── Week overview ────────────────────────────────────────────────
  const monday = useMemo(() => thisMonday(), [])
  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d }),
    [monday]
  )

  // Pagination
  const sorted    = [...reports].sort((a,b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated  = sorted.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  // ── Limit hint for create dialog ────────────────────────────────
  const selectedTypeInfo = REPORT_TYPES.find(t => t.value === form.type)
  const alreadyToday = todayTypeCount(form.type)
  const remaining = maxForType(form.type) - alreadyToday

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Reports</h1>
          <p className="text-muted-foreground mt-1">Submit and track your daily, weekly, and monthly reports</p>
        </div>
        <Button onClick={() => { resetForm(); setCreateOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Write Report
        </Button>
      </div>

      {/* Stats — 4 cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalReports ?? 0}/{summary?.expectedWorkDays ?? 0}</div>
            <p className="text-xs text-muted-foreground">Work days with report</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.completionRate ?? 0) >= 80 ? "text-green-600" : "text-orange-600"}`}>
              {Math.round(summary?.completionRate ?? 0)}%
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missing Reports</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary?.missingCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">Days without report</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{minutesToHours(totalMinutes)}</div>
            <p className="text-xs text-muted-foreground">Logged this month</p>
          </CardContent>
        </Card>
      </div>

      {/* This week overview */}
      <Card>
        <CardHeader>
          <CardTitle>This Week</CardTitle>
          <CardDescription>Daily report submission — green = submitted, red = missing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((d, i) => {
              const ds         = d.toISOString().split("T")[0]!
              const isFriday   = d.getDay() === 5
              const isToday    = d.toDateString() === now.toDateString()
              const future     = d > now
              const dayReports = reportsByDate.get(ds) ?? []
              const hasReport  = dayReports.length > 0

              return (
                <div key={i} className={`p-3 rounded-lg border text-center transition-colors ${
                  isToday ? "ring-2 ring-primary" : ""
                } ${
                  isFriday   ? "bg-muted/60" :
                  future     ? "bg-muted/30 text-muted-foreground/50" :
                  hasReport  ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" :
                               "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                }`}>
                  <div className="text-xs font-semibold mb-0.5">{DAY_NAMES[d.getDay()]}</div>
                  <div className="text-sm font-bold mb-1">{d.getDate()}</div>
                  {isFriday ? (
                    <Badge variant="secondary" className="text-xs px-1">Off</Badge>
                  ) : future ? (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  ) : hasReport ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {dayReports.length > 1 && (
                        <span className="text-xs text-green-700 font-medium">{dayReports.length}</span>
                      )}
                    </div>
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reports list */}
      <Card>
        <CardHeader>
          <CardTitle>Report History</CardTitle>
          <CardDescription>Today's reports are editable · Daily: 1/day · Weekly: 2/day · Monthly: 3/day</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reports submitted yet.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginated.map((report: any) => {
                  const { topic, time, desc } = parseContent(report.content ?? "")
                  const canEdit = isTodayStr(report.reportDate)
                  return (
                    <div key={report.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold">{topic || "Report"}</h3>
                            <Badge variant="outline">{report.type}</Badge>
                            {canEdit && <Badge className="bg-green-600 text-xs">Editable today</Badge>}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(report.reportDate).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
                            </span>
                            {time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />{time}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{desc}</p>
                        </div>
                        <div className="flex gap-1 ml-4 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => { setSelected(report); setViewOpen(true) }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canEdit && (
                            <Button size="sm" variant="ghost" onClick={() => openEdit(report)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,sorted.length)} of {sorted.length}
                  </p>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => setPage(p=>p-1)} disabled={page===1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                      <Button key={p} variant={p===page?"default":"outline"} size="sm" className="w-8" onClick={()=>setPage(p)}>{p}</Button>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setPage(p=>p+1)} disabled={page===totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              {selected && new Date(selected.reportDate).toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
            </DialogDescription>
          </DialogHeader>
          {selected && (() => {
            const { topic, time, desc } = parseContent(selected.content ?? "")
            return (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-muted-foreground">Type</Label><p className="mt-1"><Badge variant="outline">{selected.type}</Badge></p></div>
                  {time && <div><Label className="text-muted-foreground">Work Hours</Label><p className="font-medium mt-1 flex items-center gap-1"><Clock className="h-3 w-3"/>{time}</p></div>}
                </div>
                {topic && <div><Label className="text-muted-foreground">Topic</Label><p className="font-medium mt-1">{topic}</p></div>}
                <div>
                  <Label className="text-muted-foreground mb-2 block">Description</Label>
                  <div className="p-4 bg-muted rounded-lg max-h-80 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-sm">{desc || selected.content}</p>
                  </div>
                </div>
              </div>
            )
          })()}
          <DialogFooter><Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit form */}
      {[
        { open: createOpen, setOpen: setCreateOpen, title: "Write Report", desc: "Today's date is recorded automatically", onAction: handleSubmit, pending: createMutation.isPending, actionLabel: "Submit Report", isCreate: true },
        { open: editOpen,   setOpen: setEditOpen,   title: "Edit Report",  desc: "Update today's report",                 onAction: handleUpdate, pending: updateMutation.isPending, actionLabel: "Update Report", isCreate: false },
      ].map(({ open, setOpen, title, desc, onAction, pending, actionLabel, isCreate }) => (
        <Dialog key={title} open={open} onOpenChange={o => { setOpen(o); if (!o) resetForm() }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{desc}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Type selector */}
              <div className="space-y-2">
                <Label>Report Type *</Label>
                <Select value={form.type} onValueChange={v => v && setForm(f=>({...f, type:v}))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map(t => {
                      const used = todayTypeCount(t.value)
                      const max  = t.maxPerDay
                      const full = isCreate && used >= max
                      return (
                        <SelectItem key={t.value} value={t.value} disabled={full}>
                          <span className={full ? "text-muted-foreground" : ""}>
                            {t.label}
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({used}/{max} today{full ? " — limit reached" : ""})
                            </span>
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {isCreate && remaining > 0 && (
                  <p className="text-xs text-muted-foreground">
                    You can submit <strong>{remaining}</strong> more {form.type.toLowerCase()} report{remaining > 1 ? "s" : ""} today.
                  </p>
                )}
                {isCreate && remaining <= 0 && (
                  <p className="text-xs text-destructive">
                    Limit reached for {form.type.toLowerCase()} reports today. Choose a different type.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Topic *</Label>
                <Input value={form.topic} onChange={e=>setForm(f=>({...f,topic:e.target.value}))} placeholder="e.g., Frontend Development, Bug Fixes" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="time" className="pl-9" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>End Time *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="time" className="pl-9" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  rows={8}
                  className="resize-none"
                  value={form.description}
                  onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                  placeholder="Describe tasks completed, challenges, and progress..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={()=>setOpen(false)} disabled={pending}>Cancel</Button>
              <Button
                onClick={onAction}
                disabled={pending || !form.topic.trim() || !form.description.trim() || !form.startTime || !form.endTime || (isCreate && !canSubmit)}
              >
                {pending ? "Saving…" : actionLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  )
}
