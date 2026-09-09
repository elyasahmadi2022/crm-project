"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft, FileText, CheckCircle2, XCircle, AlertCircle,
  Calendar, TrendingUp, ChevronLeft, ChevronRight, Eye,
  Clock, BarChart3,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { reportService, type EmployeeReport } from "@/services/report.service"
import { attendanceService } from "@/services/attendance.service"
import { api } from "@/lib/api"

// ─── Constants ───────────────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const days: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReportDetailPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const router       = useRouter()

  const employeeId = Number(params.employeeId)
  const now = new Date()

  const [year, setYear]   = useState(Number(searchParams.get("year")  || now.getFullYear()))
  const [month, setMonth] = useState(Number(searchParams.get("month") || now.getMonth() + 1))
  const [page, setPage]   = useState(1)
  const [viewReport, setViewReport] = useState<EmployeeReport | null>(null)
  const PAGE_SIZE = 7

  useEffect(() => { setPage(1) }, [year, month])

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: empInfo } = useQuery({
    queryKey: ["emp-info", employeeId],
    queryFn: async () => {
      const r = await api.get(`/users/${employeeId}`)
      return (r.data.data ?? r.data) as { joinDate?: string; name?: string }
    },
    enabled: !!employeeId,
  })

  const { data: summary, isLoading } = useQuery({
    queryKey: ["report-monthly", employeeId, year, month],
    queryFn: () => reportService.getEmployeeMonthlySummary(employeeId, year, month),
    enabled: !!employeeId,
  })

  const { data: rawAttendance } = useQuery({
    queryKey: ["att-employee", employeeId, year, month],
    queryFn: () => attendanceService.getEmployeeAttendance(
      employeeId,
      toDateStr(year, month, 1),
      toDateStr(year, month, new Date(year, month, 0).getDate())
    ),
    enabled: !!employeeId,
  })

  // ── Derived ───────────────────────────────────────────────────────────────
  const reports      = summary?.reports ?? []
  const reportDates  = new Set(reports.map(r => r.reportDate.split("T")[0]))
  const missingSet   = new Set(summary?.missingDates ?? [])
  const calendarDays = buildCalendarDays(year, month)

  const attMap = new Map<string, string>()
  ;(rawAttendance ?? []).forEach((a: any) => {
    attMap.set((a.date ?? "").split("T")[0], a.status)
  })

  // joinDate — days before this are "before hire" (neutral)
  const joinDate = empInfo?.joinDate ? new Date(empInfo.joinDate) : null
  const joinDay  = joinDate
    ? new Date(joinDate.getFullYear(), joinDate.getMonth(), joinDate.getDate())
    : null

  function getDayStatus(day: number) {
    const d = new Date(year, month - 1, day)
    const today = new Date(); today.setHours(0, 0, 0, 0)

    // Before hire date → neutral (not counted)
    if (joinDay && d < joinDay) return "before-hire"
    if (d > today)              return "future"
    if (d.getDay() === 5)       return "weekend"      // Friday off

    const ds = toDateStr(year, month, day)
    if (reportDates.has(ds)) return "report"
    const att = attMap.get(ds)
    if (att === "ABSENT" || att === "LEAVE") return "absent"
    if (att === "PRESENT")                   return "no-report"
    return missingSet.has(ds) ? "absent" : "future"
  }

  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
  )
  const totalPages  = Math.max(1, Math.ceil(sortedReports.length / PAGE_SIZE))
  const pageReports = sortedReports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const rate         = Math.round(summary?.completionRate ?? 0)
  const employeeName = reports[0]?.employee?.name ?? empInfo?.name ?? `Employee #${employeeId}`
  const years        = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i)

  const cellClass: Record<string, string> = {
    report:       "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300",
    absent:       "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300",
    "no-report":  "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300",
    weekend:      "bg-muted/60 text-muted-foreground",
    "before-hire":"bg-muted/30 text-muted-foreground/40",
    future:       "text-muted-foreground/40",
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto py-6 space-y-6">

      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback>{getInitials(employeeName)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{employeeName}</h1>
              <p className="text-muted-foreground text-sm">
                Report history · {MONTHS[month - 1]} {year}
                {joinDay && (
                  <span className="ml-2 text-xs">
                    · Joined {joinDay.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Month / Year filter */}
        <div className="flex gap-2 shrink-0">
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports Submitted</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalReports ?? 0}</div>
              <p className="text-xs text-muted-foreground">of {summary?.expectedWorkDays ?? 0} work days since hire</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missing Reports</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{summary?.missingCount ?? 0}</div>
              <p className="text-xs text-muted-foreground">days without a report</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${rate >= 80 ? "text-green-600" : rate >= 60 ? "text-orange-600" : "text-red-600"}`}>
                {rate}%
              </div>
              <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${rate >= 80 ? "bg-green-500" : rate >= 60 ? "bg-orange-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(100, rate)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge
                variant={rate >= 80 ? "default" : rate >= 60 ? "secondary" : "destructive"}
                className="text-sm py-1 px-3"
              >
                {rate >= 90 ? "Excellent" : rate >= 80 ? "Good" : rate >= 60 ? "Needs Attention" : "Critical"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">{MONTHS[month - 1]} {year}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Attendance Calendar
              </CardTitle>
              <CardDescription>
                {MONTHS[month - 1]} {year}
                {joinDay && joinDay.getMonth() === month - 1 && joinDay.getFullYear() === year && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    · Days before hire date ({joinDay.getDate()}) are greyed out
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              {[
                { cls: "bg-green-500",  label: "Report submitted" },
                { cls: "bg-yellow-400", label: "Present, no report" },
                { cls: "bg-red-400",    label: "Absent / Missing" },
                { cls: "bg-muted",      label: "Day off (Friday)" },
                { cls: "bg-muted/30",   label: "Before hire" },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-sm ${l.cls} inline-block border`} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <>
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={idx} />
                  const status = getDayStatus(day)
                  const ds     = toDateStr(year, month, day)
                  const report = reports.find(r => r.reportDate.split("T")[0] === ds)
                  return (
                    <button
                      key={idx}
                      onClick={() => report && setViewReport(report)}
                      title={
                        status === "report"       ? "Report submitted — click to view" :
                        status === "absent"       ? "Absent / Missing report" :
                        status === "no-report"    ? "Present but no report" :
                        status === "weekend"      ? "Day off (Friday)" :
                        status === "before-hire"  ? "Before hire date" : undefined
                      }
                      className={`
                        relative flex flex-col items-center justify-center rounded-md border p-1.5 min-h-[44px] text-sm font-medium transition-colors
                        ${cellClass[status] ?? ""}
                        ${report ? "cursor-pointer hover:opacity-80" : "cursor-default"}
                      `}
                    >
                      <span>{day}</span>
                      {status === "report"    && <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600" />}
                      {status === "absent"    && <XCircle      className="h-3 w-3 mt-0.5 text-red-500" />}
                      {status === "no-report" && <Clock        className="h-3 w-3 mt-0.5 text-yellow-600" />}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Report list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Report History
          </CardTitle>
          <CardDescription>
            {reports.length} report{reports.length !== 1 ? "s" : ""} in {MONTHS[month - 1]} {year}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : pageReports.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No reports submitted this month.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pageReports.map(report => {
                const d = new Date(report.reportDate)
                return (
                  <div key={report.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/40 transition-colors">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-green-700 dark:text-green-400 leading-none">{DAY_NAMES[d.getDay()]}</span>
                        <span className="text-lg font-bold text-green-800 dark:text-green-300 leading-none">{d.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-medium text-sm">
                            {d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                          </span>
                          <Badge variant="outline" className="text-xs">{report.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{report.content}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="shrink-0 ml-2" onClick={() => setViewReport(report)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sortedReports.length)} of {sortedReports.length}
              </p>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="w-8" onClick={() => setPage(p)}>
                    {p}
                  </Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Missing days */}
      {(summary?.missingDates?.length ?? 0) > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" /> Missing Report Days ({summary!.missingCount})
            </CardTitle>
            <CardDescription>Work days since hire where no report was submitted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary!.missingDates.map(ds => (
                <Badge key={ds} variant="outline" className="border-red-300 text-red-600 dark:text-red-400">
                  {new Date(ds).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* View report dialog */}
      <Dialog open={!!viewReport} onOpenChange={open => !open && setViewReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {viewReport && new Date(viewReport.reportDate).toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {viewReport?.employee?.name}
              {viewReport && <Badge variant="outline">{viewReport.type}</Badge>}
            </DialogDescription>
          </DialogHeader>
          {viewReport && (
            <div className="py-2">
              <Separator className="mb-4" />
              <div className="bg-muted rounded-lg p-4 max-h-[50vh] overflow-y-auto">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{viewReport.content}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewReport(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
