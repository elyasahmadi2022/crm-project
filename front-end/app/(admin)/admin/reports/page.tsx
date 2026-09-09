"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  FileText, Calendar, Users, TrendingUp, AlertTriangle,
  ChevronRight, Search, ChevronLeft,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { reportService } from "@/services/report.service"

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function completionBadge(rate: number) {
  if (rate >= 90) return { label: "Excellent", variant: "default" as const, color: "text-green-600" }
  if (rate >= 70) return { label: "Good", variant: "secondary" as const, color: "text-blue-600" }
  if (rate >= 50) return { label: "Needs Attention", variant: "outline" as const, color: "text-orange-600" }
  return { label: "Critical", variant: "destructive" as const, color: "text-red-600" }
}

export default function AdminReportsPage() {
  const router = useRouter()
  const now = new Date()

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-indexed
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [year, month, search])

  const { data: summaries, isLoading } = useQuery({
    queryKey: ["reports-monthly-all", year, month],
    queryFn: () => reportService.getAllMonthlySummary(year, month),
  })

  const filtered = (summaries ?? []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.position?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Aggregate stats
  const totalEmployees = summaries?.length ?? 0
  const totalReports = summaries?.reduce((a, s) => a + s.totalReports, 0) ?? 0
  const avgCompletion = totalEmployees
    ? Math.round(summaries!.reduce((a, s) => a + s.completionRate, 0) / totalEmployees)
    : 0
  const needsAttention = (summaries ?? []).filter(s => s.completionRate < 70).length

  // Year options
  const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i)

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Employee Reports</h1>
        <p className="text-muted-foreground mt-1">
          Monthly report completion tracking — click an employee to view their full report history
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">{MONTHS[month - 1]} {year}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Submitted</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgCompletion >= 70 ? "text-green-600" : "text-orange-600"}`}>
              {avgCompletion}%
            </div>
            <p className="text-xs text-muted-foreground">Across all employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{needsAttention}</div>
            <p className="text-xs text-muted-foreground">Below 70% completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            {/* Month selector */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Month</p>
              <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Year selector */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Year</p>
              <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Search */}
            <div className="flex-1 min-w-48 space-y-1">
              <p className="text-xs text-muted-foreground">Search</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by name, position, department…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee summary list */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Report Summary</CardTitle>
          <CardDescription>
            {MONTHS[month - 1]} {year} — click a row to see the full report history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No report data found for this period.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginated.map(emp => {
                const badge = completionBadge(emp.completionRate)
                const rate = Math.round(emp.completionRate)
                return (
                  <button
                    key={emp.id}
                    onClick={() => router.push(`/admin/reports/${emp.id}?year=${year}&month=${month}`)}
                    className="w-full text-left flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{emp.name}</span>
                        {emp.position && (
                          <span className="text-xs text-muted-foreground">{emp.position}</span>
                        )}
                        {emp.department && (
                          <span className="text-xs text-muted-foreground">· {emp.department}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {emp.totalReports} of {emp.expectedWorkDays} reports submitted
                        {emp.missingCount > 0 && (
                          <span className="text-destructive ml-2">· {emp.missingCount} missing</span>
                        )}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="hidden sm:block w-32">
                      <div className="flex justify-between text-xs mb-1">
                        <span className={badge.color}>{rate}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            rate >= 90 ? "bg-green-500" :
                            rate >= 70 ? "bg-blue-500" :
                            rate >= 50 ? "bg-orange-500" : "bg-red-500"
                          }`}
                          style={{ width: `${Math.min(100, rate)}%` }}
                        />
                      </div>
                    </div>

                    <Badge variant={badge.variant} className="shrink-0 hidden sm:flex">
                      {badge.label}
                    </Badge>

                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(p)}
                    className="w-8"
                  >
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
    </div>
  )
}
