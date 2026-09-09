"use client"

import * as React from "react"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus, Search, Pencil, Loader2,
  Receipt, TrendingDown, Tag, Calendar,
  Briefcase,
} from "lucide-react"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { Button }    from "@/components/ui/button"
import { Input }     from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton }  from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"

import {
  useListExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
} from "@/queries/finance.queries"
import { useListProjectsQuery }  from "@/queries/project.queries"
import { useExpenseCategoryConfigsQuery } from "@/queries/expense-category.queries"
import type { ExpenseDto, ExpenseCategory, ListExpensesQuery } from "@/services/finance.service"
import type { CustomCategoryDto } from "@/services/expense-category.service"

// ── constants ─────────────────────────────────────────────────────────────────
const ALL_CATEGORIES: ExpenseCategory[] = [
  "SOFTWARE", "HARDWARE", "MARKETING", "TRAVEL", "SALARIES", "OFFICE", "OTHER",
]
// Default labels (used before category configs load)
const DEFAULT_CAT_LABELS: Record<ExpenseCategory, string> = {
  SOFTWARE: "Software", HARDWARE: "Hardware", MARKETING: "Marketing",
  TRAVEL: "Travel", SALARIES: "Salaries", OFFICE: "Office", OTHER: "Other",
  CUSTOM: "Custom",
}
const DEFAULT_CAT_COLORS: Record<ExpenseCategory, string> = {
  SOFTWARE:  "#6366f1",
  HARDWARE:  "#64748b",
  MARKETING: "#a855f7",
  TRAVEL:    "#f97316",
  SALARIES:  "#22c55e",
  OFFICE:    "#eab308",
  OTHER:     "#71717a",
  CUSTOM:    "#6366f1",
}

// "Link to" types — an expense can be linked to a project
type LinkType = "none" | "project"

const LINK_TYPE_OPTIONS: { value: LinkType; label: string; icon: React.ElementType }[] = [
  { value: "none",    label: "No link",  icon: Tag },
  { value: "project", label: "Project",  icon: Briefcase },
]

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtMoney(v: string | number | null | undefined) {
  if (v == null) return "—"
  const n = typeof v === "string" ? parseFloat(v) : v
  return isNaN(n) ? "—" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
}
function fmtDate(v: string | null | undefined) {
  if (!v) return "—"
  return new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: React.ElementType; color: string
}) {
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

// ── Category badge (handles both built-in and custom) ────────────────────────
function CategoryBadge({
  expense,
  customCategories,
}: {
  expense: ExpenseDto
  customCategories: CustomCategoryDto[]
}) {
  // Custom category takes precedence
  if (expense.category === "CUSTOM" && expense.customCategory) {
    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
        style={{ backgroundColor: expense.customCategory.color }}
      >
        {expense.customCategory.name}
      </span>
    )
  }
  const color = DEFAULT_CAT_COLORS[expense.category] ?? "#71717a"
  const label = DEFAULT_CAT_LABELS[expense.category] ?? expense.category
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  )
}

// ── schema ─────────────────────────────────────────────────────────────────────
const expenseSchema = z.object({
  description: z.string().min(1, "Description is required."),
  category:    z.enum(["SOFTWARE","HARDWARE","MARKETING","TRAVEL","SALARIES","OFFICE","OTHER","CUSTOM"] as const, {
    error: "Please select a category.",
  }),
  amount:           z.coerce.number().min(0.01, "Amount is required."),
  spentAt:          z.string().optional(),
  linkType:         z.enum(["none", "project"]),
  linkedId:         z.union([z.coerce.number().positive(), z.literal(""), z.undefined()]),
  customCategoryId: z.union([z.coerce.number().positive(), z.literal(""), z.undefined()]),
})
type ExpenseForm = z.infer<typeof expenseSchema>

// ── Determine initial linkType/linkedId from an existing expense ──────────────
function resolveInitialLink(exp?: ExpenseDto): { linkType: LinkType; linkedId: string } {
  if (!exp) return { linkType: "none", linkedId: "" }
  if (exp.project) return { linkType: "project", linkedId: String(exp.project.id) }
  return { linkType: "none", linkedId: "" }
}

// ── Form ──────────────────────────────────────────────────────────────────────
function ExpenseFormDialog({ initial, onClose }: { initial?: ExpenseDto; onClose: () => void }) {
  const isEdit    = !!initial
  const createMut = useCreateExpenseMutation()
  const updateMut = useUpdateExpenseMutation()
  const isPending = createMut.isPending || updateMut.isPending

  const { data: pData } = useListProjectsQuery()
  const { data: cfgData } = useExpenseCategoryConfigsQuery()

  const projects         = pData?.data ?? []
  const customCategories = cfgData ?? []

  const { linkType: initLinkType, linkedId: initLinkedId } = resolveInitialLink(initial)

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      description: initial?.description ?? "",
      category:    initial?.category    ?? ("OTHER" as ExpenseCategory),
      amount:      initial ? parseFloat(initial.amount) : (undefined as unknown as number),
      spentAt:     initial?.spentAt?.slice(0, 10) ?? "",
      linkType:         initLinkType,
      linkedId:         (initLinkedId || undefined) as number | "" | undefined,
      customCategoryId: initial?.customCategory?.id as number | "" | undefined,
    },
    mode: "onTouched",
  })

  const linkType = watch("linkType")
  const linkedId = watch("linkedId")

  // When linkType changes, clear the selection
  function handleLinkTypeChange(val: LinkType) {
    setValue("linkType", val)
    setValue("linkedId", "")
  }

  function onSubmit(v: ExpenseForm) {
    const id = v.linkedId ? Number(v.linkedId) : undefined
    const dto = {
      description:      v.description,
      category:         v.category,
      amount:           v.amount,
      spentAt:          v.spentAt || undefined,
      projectId:        v.linkType === "project" ? id : undefined,
      customCategoryId: v.customCategoryId ? Number(v.customCategoryId) : undefined,
    }
    if (isEdit) {
      updateMut.mutate({ id: initial.id, dto }, { onSuccess: onClose })
    } else {
      createMut.mutate(dto, { onSuccess: onClose })
    }
  }

  // Build the selectable list depending on linkType
  const linkItems: { id: number; name: string; sub?: string }[] = React.useMemo(() => {
    if (linkType === "project") return projects.map(p => ({ id: p.id, name: p.name, sub: p.stage }))
    return []
  }, [linkType, projects])

  // The selected item name for display
  const selectedItem = linkItems.find(i => String(i.id) === String(linkedId))

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="exp-desc" className="text-sm font-medium">
          Description <span className="text-destructive">*</span>
        </label>
        <Input
          id="exp-desc"
          placeholder="e.g. AWS monthly subscription"
          aria-invalid={!!errors.description}
          {...register("description")}
        />
        <FieldError message={errors.description?.message} />
      </div>

      {/* Category + Amount */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Category <span className="text-destructive">*</span>
          </label>
          <Controller control={control} name="category" render={({ field }) => (
            <Select value={field.value} onValueChange={(val) => {
              field.onChange(val)
              // If switching away from CUSTOM, clear customCategoryId
              if (val !== "CUSTOM") setValue("customCategoryId", undefined)
            }}>
              <SelectTrigger className="w-full" aria-invalid={!!errors.category}>
                <SelectValue>
                  {field.value === "CUSTOM"
                    ? "Custom…"
                    : field.value
                    ? DEFAULT_CAT_LABELS[field.value as ExpenseCategory] ?? field.value
                    : "Select"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {/* Built-in categories */}
                {ALL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: DEFAULT_CAT_COLORS[c] }} />
                      {DEFAULT_CAT_LABELS[c]}
                    </div>
                  </SelectItem>
                ))}
                {/* Custom categories */}
                {customCategories.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-t mt-1 pt-2">
                      Custom
                    </div>
                    <SelectItem value="CUSTOM">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full shrink-0 bg-muted-foreground" />
                        Select custom category…
                      </div>
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          )} />
          <FieldError message={errors.category?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="exp-amount" className="text-sm font-medium">
            Amount ($) <span className="text-destructive">*</span>
          </label>
          <Input
            id="exp-amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            aria-invalid={!!errors.amount}
            {...register("amount")}
          />
          <FieldError message={errors.amount?.message} />
        </div>
      </div>

      {/* Custom category picker — shown when CUSTOM is selected */}
      {watch("category") === "CUSTOM" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Custom category <span className="text-destructive">*</span>
          </label>
          {customCategories.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No custom categories yet. Create some in Settings → Expense Categories.
            </p>
          ) : (
            <Controller control={control} name="customCategoryId" render={({ field }) => (
              <div className="border rounded-lg overflow-hidden divide-y max-h-40 overflow-y-auto">
                {customCategories.map((cat) => {
                  const isSelected = String(cat.id) === String(field.value)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => field.onChange(String(cat.id))}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                        isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/60"
                      }`}
                    >
                      <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="flex-1 truncate">{cat.name}</span>
                      {cat.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-32">{cat.description}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )} />
          )}
        </div>
      )}

      {/* Date */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Date spent</label>
        <Controller control={control} name="spentAt" render={({ field }) => (
          <DatePicker
            value={field.value ? new Date(field.value) : undefined}
            onChange={(d) => field.onChange(d ? d.toISOString().split("T")[0] : "")}
            placeholder="Pick date"
          />
        )} />
      </div>

      <Separator />

      {/* ── Link to section ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Link to</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Optionally associate this expense with a project, budget, or campaign.
          </p>
        </div>

        {/* Type selector — 4 pill buttons */}
        <div className="flex gap-2 flex-wrap">
          {LINK_TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleLinkTypeChange(value)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-colors ${
                linkType === value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/60 border-muted hover:bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Dynamic item list — only shown when a type is selected */}
        {linkType !== "none" && (
          <Controller control={control} name="linkedId" render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground capitalize">
                Select {linkType}
              </label>
              {linkItems.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">
                  No {linkType}s found. Create one first.
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden divide-y max-h-52 overflow-y-auto">
                  {/* "None" option */}
                  <button
                    type="button"
                    onClick={() => field.onChange("")}
                    className={`w-full flex items-center px-3 py-2 text-sm transition-colors text-left ${
                      !field.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    — None
                  </button>
                  {linkItems.map((item) => {
                    const isSelected = String(item.id) === String(field.value)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => field.onChange(String(item.id))}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors text-left ${
                          isSelected
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted/60"
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        {item.sub && (
                          <span className="text-xs text-muted-foreground ml-2 shrink-0 uppercase tracking-wide">
                            {item.sub.toLowerCase().replace("_", " ")}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Selected display */}
              {field.value && selectedItem && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">Selected:</span>
                  <Badge variant="secondary" className="text-xs">{selectedItem.name}</Badge>
                  <button
                    type="button"
                    onClick={() => field.onChange("")}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-auto"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )} />
        )}
      </div>

      <DialogFooter showCloseButton>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-3.5 animate-spin" />}
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Add expense"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ExpensesPage() {
  const [search,     setSearch]     = React.useState("")
  const [catFilter,  setCatFilter]  = React.useState<ExpenseCategory | "ALL">("ALL")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<ExpenseDto | null>(null)

  const { data: cfgData } = useExpenseCategoryConfigsQuery()
  const customCategories = cfgData ?? []

  const queryParams: ListExpensesQuery = {}
  if (catFilter !== "ALL") queryParams.category = catFilter

  const { data, isLoading } = useListExpensesQuery(queryParams)
  const expenses = data?.data ?? []

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return expenses
    return expenses.filter((e) =>
      e.description.toLowerCase().includes(q) ||
      e.project?.name.toLowerCase().includes(q),
    )
  }, [expenses, search])

  const totalSpent = expenses.reduce((s, e) => s + parseFloat(e.amount), 0)
  const thisMonth  = expenses.filter((e) => {
    const d = new Date(e.spentAt), now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((s, e) => s + parseFloat(e.amount), 0)

  const topCategory = React.useMemo(() => {
    const totals: Partial<Record<string, number>> = {}
    expenses.forEach((e) => {
      const key = e.category === "CUSTOM" && e.customCategory
        ? `custom:${e.customCategory.id}`
        : e.category
      totals[key] = (totals[key] ?? 0) + parseFloat(e.amount)
    })
    const sorted = Object.entries(totals).sort((a, b) => (b[1] as number) - (a[1] as number))
    if (!sorted[0]) return "—"
    const key = sorted[0][0]
    if (key.startsWith("custom:")) {
      const id = parseInt(key.split(":")[1] ?? "0", 10)
      return customCategories.find(c => c.id === id)?.name ?? "Custom"
    }
    return DEFAULT_CAT_LABELS[key as ExpenseCategory] ?? key
  }, [expenses, customCategories])

  function catLabel(c: ExpenseCategory) {
    return DEFAULT_CAT_LABELS[c] ?? c
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track and categorise all spending.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button><Plus className="size-4" />Add expense</Button>} />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Add expense</DialogTitle></DialogHeader>
            <ExpenseFormDialog onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total expenses" value={fmtMoney(totalSpent)}
          icon={TrendingDown} color="text-red-600 bg-red-100" />
        <StatCard label="This month" value={fmtMoney(thisMonth)}
          icon={Calendar} color="text-orange-600 bg-orange-100" />
        <StatCard label="Total records" value={String(data?.meta.total ?? 0)}
          icon={Receipt} color="text-blue-600 bg-blue-100" />
        <StatCard label="Top category" value={topCategory}
          icon={Tag} color="text-purple-600 bg-purple-100" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by description, budget or project…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={catFilter} onValueChange={(v) => setCatFilter(v as ExpenseCategory | "ALL")}>
          <SelectTrigger className="w-48">
            <SelectValue>{catFilter === "ALL" ? "All categories" : catLabel(catFilter)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {ALL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: DEFAULT_CAT_COLORS[c] ?? "#71717a" }}
                  />
                  {catLabel(c)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {!isLoading && filtered.length === 0 ? (
          <Empty className="border-0 bg-muted/20 min-h-64">
            <EmptyHeader>
              <EmptyMedia variant="icon"><Receipt className="size-4" /></EmptyMedia>
              <EmptyTitle>No expenses found</EmptyTitle>
              <EmptyDescription>
                {search || catFilter !== "ALL"
                  ? "No expenses match your current filters."
                  : "No expenses recorded yet. Add your first expense to start tracking."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-3.5" />Add expense
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Linked to</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : (
                filtered.map((exp) => {
                  // Determine what it's linked to
                  const linkedTo = exp.project
                    ? { label: exp.project.name, href: `/admin/projects/${exp.project.id}`, type: "project" as const }
                    : null

                  return (
                    <TableRow key={exp.id}>
                      <TableCell className="font-medium max-w-48 truncate">{exp.description}</TableCell>
                      <TableCell>
                        <CategoryBadge expense={exp} customCategories={customCategories} />
                      </TableCell>
                      <TableCell className="font-medium">{fmtMoney(exp.amount)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{fmtDate(exp.spentAt)}</TableCell>
                      <TableCell>
                        {linkedTo ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              {linkedTo.type}
                            </span>
                            <Link
                              href={linkedTo.href}
                              className="text-sm hover:text-primary hover:underline transition-colors truncate max-w-32"
                            >
                              {linkedTo.label}
                            </Link>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Edit expense"
                            onClick={() => setEditTarget(exp)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {data?.meta.total ?? filtered.length} expenses
        </p>
      )}

      {/* Edit dialog */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit expense</DialogTitle></DialogHeader>
          {editTarget && (
            <ExpenseFormDialog initial={editTarget} onClose={() => setEditTarget(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
