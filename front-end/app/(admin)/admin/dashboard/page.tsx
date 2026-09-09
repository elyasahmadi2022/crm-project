"use client"

import {
  Briefcase,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MessageSquare,
  Phone,
  Mail,
  Users,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LeadsChart } from "@/components/dashboard/leads-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useDashboardOverviewQuery } from "@/queries/dashboard.queries"

// ─────────────────────────────────────────────────
// Icon mapping
// ─────────────────────────────────────────────────
const iconMap: Record<string, React.ElementType> = {
  Briefcase,
  TrendingUp,
  DollarSign,
  AlertTriangle,
}

type Stage = "REQUIREMENTS" | "DESIGN" | "DEVELOPMENT" | "TESTING" | "DEPLOYMENT" | "LIVE"

const stageColors: Record<Stage, string> = {
  REQUIREMENTS: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  DESIGN:       "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  DEVELOPMENT:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  TESTING:      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  DEPLOYMENT:   "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  LIVE:         "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
}

type LeadStatus = "NEW" | "CONTACTED" | "PENDING" | "ON_HOLD" | "WON" | "LOST"

const pipelineColumns: { status: LeadStatus; label: string; color: string }[] = [
  { status: "NEW",       label: "New",       color: "border-blue-300   bg-blue-50   dark:bg-blue-950/30"   },
  { status: "CONTACTED", label: "Contacted", color: "border-purple-300 bg-purple-50 dark:bg-purple-950/30" },
  { status: "PENDING",   label: "Pending",   color: "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30" },
  { status: "ON_HOLD",   label: "On Hold",   color: "border-orange-300 bg-orange-50 dark:bg-orange-950/30" },
  { status: "WON",       label: "Won",       color: "border-green-300  bg-green-50  dark:bg-green-950/30"  },
  { status: "LOST",      label: "Lost",      color: "border-red-300    bg-red-50    dark:bg-red-950/30"    },
]

// ─────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data, isLoading } = useDashboardOverviewQuery()

  console.log(data)
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 pb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 })?.map((_, i) => (
            <Card key={i}>
              <CardContent className="py-5">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No dashboard data available</p>
      </div>
    )
  }

  const { stats = [], projects = [], milestones = [], leads = [], financeSnapshot, campaigns = [], leadsChart = [] } = data

  return (
    <div className="flex flex-col gap-4 pb-8">

      {/* ── Row 1: Key Metrics Strip ─────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-muted-foreground text-center">No statistics available</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          stats.map((s) => {
            const Icon = iconMap[s.icon] || Briefcase
            return (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-4 py-5">
                  <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", s.color)}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs text-muted-foreground truncate">{s.label}</span>
                    <span className="text-2xl font-bold leading-none">{s.value}</span>
                    <div className={cn("flex items-center gap-1 text-xs font-medium", s.up ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400")}>
                      {s.up
                        ? <ArrowUpRight className="size-3.5 shrink-0" />
                        : <ArrowDownRight className="size-3.5 shrink-0" />
                      }
                      <span>{s.trend}</span>
                      <span className="text-muted-foreground font-normal">{s.sub}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* ── Row 2: Leads & Conversion Chart ─────── */}
      <LeadsChart data={leadsChart} />

      {/* ── Row 3: Active Projects + Milestones ──── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Projects table — 8/12 */}
        <Card className="col-span-12 lg:col-span-8">
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
            <CardDescription>Sorted by most recently updated</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No active projects</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Project</th>
                      <th className="px-4 py-2.5 font-medium">Customer</th>
                      <th className="px-4 py-2.5 font-medium">Stage</th>
                      <th className="px-4 py-2.5 font-medium">Team</th>
                      <th className="px-4 py-2.5 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects?.map((p, i) => (
                      <tr
                        key={p.id}
                        className={cn(
                          "border-b last:border-0 hover:bg-muted/40 transition-colors cursor-pointer",
                          i % 2 === 1 && "bg-muted/20",
                        )}
                      >
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.customer}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            p.stage && stageColors[p.stage as Stage] 
                              ? stageColors[p.stage as Stage] 
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          )}>
                            {p.stage || "Unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex -space-x-1.5">
                            {p.team && p.team.length > 0 ? (
                              p.team.map((t) => (
                                <div
                                  key={t}
                                  title={t}
                                  className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-sidebar-primary text-sidebar-primary-foreground text-[10px] font-bold"
                                >
                                  {t}
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No team</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{p.updated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Milestones — 4/12 */}
        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Milestones Due Soon</CardTitle>
            <CardDescription>Next 14 days</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-4 pt-0">
            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming milestones</p>
            ) : (
              milestones?.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-lg border p-3",
                    m.overdue
                      ? "border-destructive/40 bg-destructive/5"
                      : "border-border bg-muted/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn("text-sm font-medium leading-snug", m.overdue && "text-destructive")}>
                      {m.title}
                    </span>
                    {m.overdue && (
                      <span className="shrink-0 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                        Overdue
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{m.project}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="size-3 shrink-0" />
                    {m.dueDate}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Leads Pipeline (Kanban) ────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Leads Pipeline</CardTitle>
          <CardDescription>Current status of all active leads</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {pipelineColumns?.map((col) => {
              const colLeads = leads.filter((l) => l.status === col.status)
              return (
                <div key={col.status} className={cn("flex flex-col gap-2 rounded-xl border p-3", col.color)}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{col.label}</span>
                    <span className="rounded-full bg-background/70 px-1.5 py-0.5 text-[10px] font-bold">
                      {colLeads.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {colLeads.slice(0, 5)?.map((l) => (
                      <div
                        key={l.id}
                        className="rounded-lg border border-border/60 bg-background/80 p-2 shadow-sm cursor-pointer hover:bg-background transition-colors"
                      >
                        <p className="text-xs font-medium truncate">{l.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{l.company}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {l.days === 0 ? "Today" : `${l.days}d`}
                        </p>
                      </div>
                    ))}
                    {colLeads.length === 0 && (
                      <p className="text-[11px] text-muted-foreground py-2 text-center">Empty</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Row 5: Finance + Marketing ───────────── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Finance snapshot — 6/12 */}
        <Card className="col-span-12 lg:col-span-6">
          <CardHeader>
            <CardTitle>Finance Snapshot</CardTitle>
            <CardDescription>This month's invoicing overview</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Mini bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Invoiced</span>
                <span>
                  {Object.entries(financeSnapshot?.totalsByCurrency ?? {}).map(([currency, totals]) => `${totals.invoiced.toLocaleString()} ${currency}`).join(" / ") || "0"}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                {(() => {
                  if (!financeSnapshot) return null
                  const currencyEntries = Object.entries(financeSnapshot.totalsByCurrency ?? {})
                  if (currencyEntries.length > 1) {
                    return <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Separate currencies shown below</div>
                  }
                  
                  const totals = Object.values(financeSnapshot.totalsByCurrency ?? {})
                  const total = totals.reduce((sum, value) => sum + value.invoiced, 0)
                  const paid = totals.reduce((sum, value) => sum + value.paid, 0)
                  const outstanding = totals.reduce((sum, value) => sum + value.outstanding, 0)
                  const overdue = totals.reduce((sum, value) => sum + value.overdue, 0)
                  
                  if (total === 0) {
                    return <div className="h-full w-full bg-muted" />
                  }
                  
                  const paidPct = (paid / total) * 100
                  const outstandingPct = (outstanding / total) * 100
                  const overduePct = (overdue / total) * 100

                  return (
                    <>
                      {paidPct > 0 && <div className="h-full bg-green-500 rounded-l-full" style={{ width: `${paidPct}%` }} />}
                      {outstandingPct > 0 && <div className="h-full bg-yellow-400" style={{ width: `${outstandingPct}%` }} />}
                      {overduePct > 0 && <div className="h-full bg-destructive rounded-r-full" style={{ width: `${overduePct}%` }} />}
                    </>
                  )
                })()}
              </div>
              <div className="flex gap-4 text-xs flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-green-500 inline-block" /> 
                  Paid {Object.entries(financeSnapshot?.totalsByCurrency ?? {}).map(([currency, totals]) => `${totals.paid.toLocaleString()} ${currency}`).join(" / ") || "0"}
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-yellow-400 inline-block" /> 
                  Outstanding {Object.entries(financeSnapshot?.totalsByCurrency ?? {}).map(([currency, totals]) => `${totals.outstanding.toLocaleString()} ${currency}`).join(" / ") || "0"}
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-destructive inline-block" /> 
                  Overdue {Object.entries(financeSnapshot?.totalsByCurrency ?? {}).map(([currency, totals]) => `${totals.overdue.toLocaleString()} ${currency}`).join(" / ") || "0"}
                </span>
              </div>
            </div>

            <Separator />

            {/* Overdue list */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Most Overdue</p>
              {!financeSnapshot?.overdueInvoices || financeSnapshot.overdueInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No overdue invoices</p>
              ) : (
                financeSnapshot.overdueInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{inv.customer}</p>
                      <p className="text-xs text-destructive">{inv.days} days overdue</p>
                    </div>
                    <Badge variant="destructive" className="text-xs">{inv.amount}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Marketing snapshot — 6/12 */}
        <Card className="col-span-12 lg:col-span-6">
          <CardHeader>
            <CardTitle>Marketing Snapshot</CardTitle>
            <CardDescription>Active campaigns and their performance</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No active campaigns</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Campaign</th>
                      <th className="px-4 py-2.5 font-medium">Budget</th>
                      <th className="px-4 py-2.5 font-medium">Spend</th>
                      <th className="px-4 py-2.5 font-medium">Leads</th>
                      <th className="px-4 py-2.5 font-medium">CVR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns?.map((c, i) => (
                      <tr key={c.id} className={cn("border-b last:border-0 hover:bg-muted/40 transition-colors", i % 2 === 1 && "bg-muted/20")}>
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.budget}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.spend}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1">
                            <Users className="size-3.5 text-muted-foreground" />
                            {c.leads}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs">{c.rate}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
