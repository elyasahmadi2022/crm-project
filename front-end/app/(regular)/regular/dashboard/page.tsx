"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import {
  Briefcase, FileText, Clock, CheckCircle2, XCircle,
  Calendar, TrendingUp, AlertCircle, Wallet, User,
  Building2, Timer, ChevronRight, ArrowUpRight,
  LogIn, LogOut, Pen, Award, BarChart3, Flame,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"

// ─── helpers ────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}
function parseMins(t: string) {
  const [h, m] = t.split(":").map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}
function fmtHours(mins: number) {
  const h = Math.floor(mins / 60), m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}
function parseTopic(content: string) {
  return content.match(/^Topic: (.+)/m)?.[1] ?? content.split("\n")[0] ?? "Report"
}
function parseTime(content: string) {
  return content.match(/^Time: (.+)/m)?.[1] ?? ""
}
function weekMondayDays() {
  const today = new Date(); today.setHours(0,0,0,0)
  const off = today.getDay() === 0 ? 6 : today.getDay() - 1
  const mon = new Date(today); mon.setDate(today.getDate() - off)
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
}
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

// ─── score label ────────────────────────────────────────────────────
function scoreLabel(s: number): { label: string; color: string; Icon: typeof Flame } {
  if (s >= 90) return { label: "Outstanding", color: "text-emerald-600", Icon: Award }
  if (s >= 80) return { label: "Good",        color: "text-green-600",   Icon: TrendingUp }
  if (s >= 60) return { label: "Fair",         color: "text-amber-600",   Icon: BarChart3 }
  return           { label: "Needs focus",   color: "text-red-600",     Icon: Flame }
}

// ─── small stat card ────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "", icon: Icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon: any
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-2xl font-bold leading-none ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{sub}</p>}
          </div>
          <div className="p-2 rounded-xl bg-muted ml-3 shrink-0">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── page ────────────────────────────────────────────────────────────
export default function RegularDashboardPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const todayStr = now.toISOString().split("T")[0]!
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening"

  // queries
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/auth/me")).data.data,
    enabled: !!user,
  })

  const { data: monthAtt } = useQuery({
    queryKey: ["att-monthly", year, month],
    queryFn: async () => (await api.get(`/attendance/employee/${user!.id}/monthly/${year}/${month}`)).data.data,
    enabled: !!user,
  })

  const { data: todayAtt } = useQuery({
    queryKey: ["att-today"],
    queryFn: async () => {
      const r = await api.get(`/attendance/employee/${user!.id}`, { params: { startDate: todayStr, endDate: todayStr } })
      const arr = r.data.data ?? r.data
      return Array.isArray(arr) ? (arr[0] ?? null) : null
    },
    enabled: !!user,
  })

  const { data: rptSummary } = useQuery({
    queryKey: ["rpt-summary", year, month],
    queryFn: async () => (await api.get(`/reports/employee/${user!.id}/monthly/${year}/${month}`)).data.data,
    enabled: !!user,
  })

  const { data: reports = [] } = useQuery({
    queryKey: ["reports", year, month],
    queryFn: async () => {
      const r = await api.get("/reports", { params: { year, month } })
      return [...(r.data.data ?? r.data)].sort((a: any, b: any) =>
        new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
      ).slice(0, 5)
    },
    enabled: !!user,
  })

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-me", user?.id],
    queryFn: async () => {
      const r = await api.get("/projects", { params: { assignedEmployeeId: user!.id } })
      const raw = r.data.data ?? r.data
      return (Array.isArray(raw) ? raw : raw.data ?? []).slice(0, 4)
    },
    enabled: !!user,
  })

  const { data: payrolls = [] } = useQuery({
    queryKey: ["payroll-me", user?.id],
    queryFn: async () => {
      const r = await api.get(`/payroll/employee/${user!.id}/history`)
      const arr = r.data.data ?? r.data
      return Array.isArray(arr) ? arr.slice(0, 3) : []
    },
    enabled: !!user,
  })

  // derived
  const attDateSet = useMemo(() =>
    new Set((monthAtt?.attendance ?? []).map((a: any) => (a.date ?? "").split("T")[0]))
  , [monthAtt])

  const rptDateSet = useMemo(() =>
    new Set((rptSummary?.reports ?? []).map((r: any) => (r.reportDate ?? "").split("T")[0]))
  , [rptSummary])

  const totalMins = useMemo(() =>
    reports.reduce((acc: number, r: any) => {
      const t = parseTime(r.content ?? "")
      const [s, e] = t.split("–").map((x: string) => x.trim())
      if (!s || !e) return acc
      const d = parseMins(e) - parseMins(s)
      return acc + (d > 0 ? d : 0)
    }, 0)
  , [reports])

  const weekDays    = useMemo(() => weekMondayDays(), [])
  const attRate     = Math.round(monthAtt?.attendanceRate ?? 0)
  const rptRate     = Math.round(rptSummary?.completionRate ?? 0)
  const score       = Math.round((attRate + rptRate) / 2)
  const sl          = scoreLabel(score)
  const salary      = profile?.salary ? Number(profile.salary) : null
  const joinDate    = profile?.joinDate ? new Date(profile.joinDate) : null
  const daysIn      = joinDate ? Math.floor((now.getTime() - joinDate.getTime()) / 86400000) : null
  const checkedIn   = !!todayAtt?.checkIn
  const checkedOut  = !!todayAtt?.checkOut
  const reportedToday = rptDateSet.has(todayStr)
  const activeProj  = projects.filter((p: any) => !["COMPLETED","CANCELLED"].includes(p.stage ?? "")).length
  const allMiles    = projects.flatMap((p: any) => p.milestones ?? [])
  const doneMiles   = allMiles.filter((m: any) => m.status === "COMPLETED").length

  if (loadingProfile) {
    return (
      <div className="container mx-auto py-6 space-y-5">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-5">

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <Card className="overflow-hidden border-0 shadow-md">
        <div className="bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 p-6 text-white">
          <div className="flex items-center gap-5 flex-wrap">
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className="h-16 w-16 border-2 border-white/20 shadow-xl">
                <AvatarImage src={profile?.avatarUrl} />
                <AvatarFallback className="bg-white/10 text-white text-xl font-bold backdrop-blur-sm">
                  {initials(profile?.name ?? user?.name ?? "U")}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-400 border-2 border-white" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-blue-200 text-sm font-medium">{greeting}</p>
              <h1 className="text-2xl font-bold mt-0.5 truncate">
                {(profile?.name ?? user?.name ?? "").split(" ")[0]}
              </h1>
              <div className="flex flex-wrap gap-3 mt-2">
                {profile?.position && (
                  <span className="flex items-center gap-1.5 text-blue-100 text-xs bg-white/10 px-2.5 py-1 rounded-full">
                    <User className="h-3 w-3" />{profile.position}
                  </span>
                )}
                {profile?.department && (
                  <span className="flex items-center gap-1.5 text-blue-100 text-xs bg-white/10 px-2.5 py-1 rounded-full">
                    <Building2 className="h-3 w-3" />{profile.department}
                  </span>
                )}
                {daysIn !== null && (
                  <span className="flex items-center gap-1.5 text-blue-100 text-xs bg-white/10 px-2.5 py-1 rounded-full">
                    <Award className="h-3 w-3" />{daysIn} days
                  </span>
                )}
              </div>
            </div>

            {/* Salary */}
            <div className="shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[140px]">
              <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-1">Monthly Salary</p>
              <p className="text-2xl font-bold">
                {salary ? salary.toLocaleString() : "—"}
              </p>
              <p className="text-blue-300 text-xs mt-0.5">AFN / month</p>
            </div>
          </div>

          {/* Score bar */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-48">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-blue-200 font-medium">Overall Performance</span>
                <span className="font-bold text-white">{score}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full transition-all duration-700"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
            <div className={`flex items-center gap-1.5 text-sm font-semibold bg-white/10 px-3 py-1.5 rounded-full ${sl.color}`}>
              <sl.Icon className="h-3.5 w-3.5" />
              <span className="text-white">{sl.label}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Today status ─────────────────────────────────────────── */}
      <div className="grid gap-3 md:grid-cols-3">
        {/* Check-in */}
        <Card className={`overflow-hidden border ${checkedIn ? "border-emerald-200 dark:border-emerald-800" : "border-amber-200 dark:border-amber-800"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${checkedIn ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-amber-100 dark:bg-amber-900/40"}`}>
                <LogIn className={`h-4 w-4 ${checkedIn ? "text-emerald-600" : "text-amber-600"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Check-in</p>
                <p className={`text-sm font-bold mt-0.5 ${checkedIn ? "text-emerald-700 dark:text-emerald-400" : "text-amber-600"}`}>
                  {checkedIn ? fmtTime(todayAtt.checkIn) : "Not checked in"}
                </p>
              </div>
              {checkedIn && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto shrink-0" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Check-out */}
        <Card className={`overflow-hidden border ${checkedOut ? "border-blue-200 dark:border-blue-800" : "border-dashed"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${checkedOut ? "bg-blue-100 dark:bg-blue-900/40" : "bg-muted"}`}>
                <LogOut className={`h-4 w-4 ${checkedOut ? "text-blue-600" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Check-out</p>
                <p className={`text-sm font-bold mt-0.5 ${checkedOut ? "text-blue-700 dark:text-blue-400" : "text-muted-foreground"}`}>
                  {checkedOut ? fmtTime(todayAtt.checkOut) : "Not checked out"}
                </p>
              </div>
              {checkedOut && (
                <CheckCircle2 className="h-4 w-4 text-blue-500 ml-auto shrink-0" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's report */}
        <Card className={`overflow-hidden border ${reportedToday ? "border-purple-200 dark:border-purple-800" : "border-red-200 dark:border-red-800"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${reportedToday ? "bg-purple-100 dark:bg-purple-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
                <Pen className={`h-4 w-4 ${reportedToday ? "text-purple-600" : "text-red-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Today's Report</p>
                <p className={`text-sm font-bold mt-0.5 ${reportedToday ? "text-purple-700 dark:text-purple-400" : "text-red-600"}`}>
                  {reportedToday ? "Submitted" : "Missing"}
                </p>
              </div>
              {reportedToday
                ? <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0" />
                : (
                  <Button size="sm" variant="destructive" className="h-7 text-xs shrink-0 rounded-lg"
                    onClick={() => router.push("/regular/reports")}>
                    Write
                  </Button>
                )
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────── */}
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Attendance Rate" value={`${attRate}%`}
          sub={`${monthAtt?.presentDays ?? 0} present · ${monthAtt?.absentDays ?? 0} absent`}
          color={attRate >= 80 ? "text-emerald-600" : "text-amber-600"}
          icon={Calendar} />
        <StatCard label="Report Rate" value={`${rptRate}%`}
          sub={`${rptSummary?.totalReports ?? 0} of ${rptSummary?.expectedWorkDays ?? 0} days`}
          color={rptRate >= 80 ? "text-emerald-600" : "text-amber-600"}
          icon={FileText} />
        <StatCard label="Hours Logged" value={fmtHours(totalMins)}
          sub="From submitted reports"
          color="text-blue-600"
          icon={Timer} />
        <StatCard label="Missing Reports" value={rptSummary?.missingCount ?? 0}
          sub="Days without a report"
          color={(rptSummary?.missingCount ?? 0) === 0 ? "text-emerald-600" : "text-red-600"}
          icon={AlertCircle} />
      </div>

      {/* ── Week + Payroll ────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Week calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">This Week</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-7 gap-1.5 mb-3">
              {weekDays.map((d, i) => {
                const ds    = d.toISOString().split("T")[0]!
                const fri   = d.getDay() === 5
                const today = d.toDateString() === now.toDateString()
                const fut   = d > now
                const hAtt  = attDateSet.has(ds)
                const hRpt  = rptDateSet.has(ds)
                const bg = fri ? "bg-muted/40" :
                  fut ? "bg-muted/20 opacity-40" :
                  (hAtt && hRpt) ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" :
                  (hAtt || hRpt) ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" :
                  "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                return (
                  <div key={i} className={`rounded-xl border p-2 text-center transition-all ${bg} ${today ? "ring-2 ring-primary ring-offset-1" : ""}`}>
                    <p className="text-xs font-semibold text-muted-foreground">{DAYS[d.getDay()]}</p>
                    <p className={`text-base font-bold mt-0.5 ${today ? "text-primary" : ""}`}>{d.getDate()}</p>
                    {fri ? (
                      <p className="text-xs text-muted-foreground mt-1">Off</p>
                    ) : fut ? (
                      <div className="h-4 mt-1" />
                    ) : (
                      <div className="flex justify-center gap-1 mt-1.5">
                        {hAtt
                          ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          : <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                        }
                        {hRpt
                          ? <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                          : <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 inline-block" />
                        }
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Legend */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Attendance
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />Report
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Missing
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payroll */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Payroll</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {/* Base */}
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800 p-3.5">
              <p className="text-xs text-muted-foreground font-medium">Base Monthly</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {salary ? `${salary.toLocaleString()}` : "—"}
                {salary && <span className="text-sm font-normal text-muted-foreground ml-1">AFN</span>}
              </p>
            </div>

            {/* Payslips */}
            {payrolls.length > 0 ? (
              <div className="space-y-1">
                {payrolls.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 px-1 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(p.year, p.month - 1).toLocaleDateString("en-US",{month:"short",year:"numeric"})}
                      </p>
                      <Badge
                        variant={p.status === "PAID" ? "default" : "secondary"}
                        className={`text-xs mt-0.5 ${p.status === "PAID" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0" : ""}`}
                      >
                        {p.status === "PAID" ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" />Paid
                          </span>
                        ) : p.status}
                      </Badge>
                    </div>
                    <p className="font-semibold text-sm">
                      {Number(p.netSalary ?? p.baseSalary ?? 0).toLocaleString()}
                      <span className="text-xs text-muted-foreground ml-1">AFN</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-3">No payslips yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Reports + Projects ────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Reports */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Reports
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => router.push("/regular/reports")}>
                View all <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <FileText className="h-5 w-5 opacity-50" />
                </div>
                <p className="text-sm">No reports this month</p>
                <Button size="sm" variant="outline" className="mt-3 rounded-lg"
                  onClick={() => router.push("/regular/reports")}>
                  Write your first report
                </Button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {reports.map((r: any) => {
                  const topic = parseTopic(r.content ?? "")
                  const time  = parseTime(r.content ?? "")
                  const d     = new Date(r.reportDate)
                  return (
                    <div key={r.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex flex-col items-center justify-center shrink-0 text-center">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 leading-none">
                          {d.toLocaleDateString("en-US",{month:"short"})}
                        </span>
                        <span className="text-sm font-black text-purple-800 dark:text-purple-300 leading-none">
                          {d.getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{topic}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">{r.type}</span>
                          {time && (
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <Clock className="h-2.5 w-2.5" />{time}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                My Projects
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => router.push("/regular/my-projects")}>
                View all <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
            {projects.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {activeProj} active · {doneMiles}/{allMiles.length} milestones
              </p>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <Briefcase className="h-5 w-5 opacity-50" />
                </div>
                <p className="text-sm">No projects assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((p: any) => {
                  const miles = p.milestones ?? []
                  const done  = miles.filter((m: any) => m.status === "COMPLETED").length
                  const prog  = miles.length > 0 ? Math.round((done / miles.length) * 100) : p.progress ?? 0
                  const isActive = !["COMPLETED","CANCELLED"].includes(p.stage ?? "")
                  return (
                    <div key={p.id} className="p-3 rounded-xl border hover:border-border/80 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{p.name}</p>
                          {p.customer && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {p.customer.companyName ?? p.customer.name}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          isActive
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        }`}>
                          {p.stage ?? "Active"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={prog} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">{prog}%</span>
                      </div>
                      {miles.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {done} of {miles.length} milestones completed
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Performance detail ────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Monthly Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                label: "Attendance",
                value: attRate,
                detail: `${monthAtt?.presentDays ?? 0} present · ${monthAtt?.absentDays ?? 0} absent · ${monthAtt?.leaveDays ?? 0} leave`,
                barColor: attRate >= 80 ? "from-emerald-400 to-emerald-600" : "from-amber-400 to-amber-600",
              },
              {
                label: "Reporting",
                value: rptRate,
                detail: `${rptSummary?.totalReports ?? 0} submitted · ${rptSummary?.missingCount ?? 0} missing`,
                barColor: rptRate >= 80 ? "from-purple-400 to-purple-600" : "from-amber-400 to-amber-600",
              },
              {
                label: "Overall Score",
                value: score,
                detail: sl.label,
                barColor: score >= 80 ? "from-blue-400 to-indigo-600" : score >= 60 ? "from-amber-400 to-orange-500" : "from-red-400 to-red-600",
              },
            ].map(({ label, value, detail, barColor }) => (
              <div key={label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-sm font-bold">{value}%</p>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
