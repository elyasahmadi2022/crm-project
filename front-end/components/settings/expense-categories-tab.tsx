"use client"

/**
 * components/settings/expense-categories-tab.tsx
 *
 * Full CRUD table for custom expense categories.
 * Admins can create, rename, recolour, add a description, and delete categories.
 * Deletion is blocked if any expenses still use that category (API enforces it).
 */

import * as React from "react"
import { Plus, Pencil, Trash2, Loader2, Check, X } from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button }    from "@/components/ui/button"
import { Input }     from "@/components/ui/input"
import { Skeleton }  from "@/components/ui/skeleton"
import { Badge }     from "@/components/ui/badge"
import {
  useExpenseCategoryConfigsQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
} from "@/queries/expense-category.queries"
import type { CustomCategoryDto } from "@/services/expense-category.service"

// ── Color swatch + hex input ──────────────────────────────────────────────────
function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const uid = React.useId()
  return (
    <div className="flex items-center gap-2">
      <div
        className="size-8 rounded border cursor-pointer shadow-sm flex-shrink-0"
        style={{ backgroundColor: value }}
        onClick={() => document.getElementById(uid)?.click()}
        title="Pick colour"
      />
      <input id={uid} type="color" value={value.startsWith("#") ? value : "#6366f1"}
        onChange={(e) => onChange(e.target.value)} className="sr-only" />
      <Input value={value} onChange={(e) => onChange(e.target.value)}
        maxLength={7} placeholder="#6366f1"
        className="h-8 w-24 font-mono text-xs" />
    </div>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-xs text-destructive mt-1">{msg}</p>
}

// ── Create / Edit dialog ──────────────────────────────────────────────────────
interface FormState { name: string; color: string; description: string }
const EMPTY: FormState = { name: "", color: "#6366f1", description: "" }

function CategoryFormDialog({
  initial,
  onClose,
}: {
  initial?: CustomCategoryDto
  onClose: () => void
}) {
  const isEdit     = !!initial
  const createMut  = useCreateExpenseCategoryMutation()
  const updateMut  = useUpdateExpenseCategoryMutation()
  const isPending  = createMut.isPending || updateMut.isPending

  const [form,   setForm]   = React.useState<FormState>({
    name:        initial?.name        ?? "",
    color:       initial?.color       ?? "#6366f1",
    description: initial?.description ?? "",
  })
  const [errors, setErrors] = React.useState<Partial<FormState>>({})

  function set(k: keyof FormState) {
    return (v: string) => { setForm(prev => ({ ...prev, [k]: v })); setErrors(prev => ({ ...prev, [k]: "" })) }
  }

  function validate(): boolean {
    const e: Partial<FormState> = {}
    if (!form.name.trim()) e.name = "Name is required."
    if (!/^#[0-9a-fA-F]{6}$/.test(form.color)) e.color = "Must be a 6-digit hex colour, e.g. #ff0000"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function submit() {
    if (!validate()) return
    const dto = {
      name:        form.name.trim(),
      color:       form.color,
      description: form.description.trim() || undefined,
    }
    if (isEdit) {
      updateMut.mutate({ id: initial.id, dto }, { onSuccess: onClose })
    } else {
      createMut.mutate(dto, { onSuccess: onClose })
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-2">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Name <span className="text-destructive">*</span></label>
          <Input value={form.name} onChange={(e) => set("name")(e.target.value)}
            placeholder="e.g. Cloud Infrastructure" maxLength={50} autoFocus />
          <FieldError msg={errors.name} />
        </div>

        {/* Color */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Color <span className="text-destructive">*</span></label>
          <ColorInput value={form.color} onChange={set("color")} />
          <FieldError msg={errors.color} />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Description <span className="text-muted-foreground text-xs">(optional)</span></label>
          <Input value={form.description} onChange={(e) => set("description")(e.target.value)}
            placeholder="Short note about what this category covers" maxLength={200} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button onClick={submit} disabled={isPending}>
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Create category"}
        </Button>
      </DialogFooter>
    </>
  )
}

// ── Delete confirmation inline ────────────────────────────────────────────────
function DeleteCell({ cat }: { cat: CustomCategoryDto }) {
  const deleteMut = useDeleteExpenseCategoryMutation()
  const [confirm, setConfirm] = React.useState(false)

  if (cat.expenseCount > 0) {
    return (
      <span className="text-xs text-muted-foreground" title={`${cat.expenseCount} expense(s) use this category`}>
        In use
      </span>
    )
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-destructive">Delete?</span>
        <Button size="sm" variant="destructive" className="h-6 px-2 text-xs"
          disabled={deleteMut.isPending}
          onClick={() => deleteMut.mutate(cat.id, { onSuccess: () => setConfirm(false) })}>
          {deleteMut.isPending ? <Loader2 className="size-3 animate-spin" /> : "Yes"}
        </Button>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs"
          onClick={() => setConfirm(false)}>No</Button>
      </div>
    )
  }

  return (
    <Button size="icon-sm" variant="ghost"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      title="Delete category"
      onClick={() => setConfirm(true)}>
      <Trash2 className="size-3.5" />
    </Button>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export function ExpenseCategoriesTab() {
  const { data: categories, isLoading } = useExpenseCategoryConfigsQuery()
  const [dialogOpen, setDialogOpen]     = React.useState(false)
  const [editTarget, setEditTarget]     = React.useState<CustomCategoryDto | undefined>()

  function openCreate() { setEditTarget(undefined); setDialogOpen(true) }
  function openEdit(cat: CustomCategoryDto) { setEditTarget(cat); setDialogOpen(true) }

  return (
    <div className="flex flex-col gap-6 mt-4">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>
              Create your own categories for classifying expenses. Categories with existing
              expenses cannot be deleted — reassign those expenses first.
            </CardDescription>
          </div>
          <div className="">
            <Button onClick={openCreate} className="shrink-0">
            <Plus className="size-4" />
            New category
          </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !categories || categories.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center px-4">
              <p className="text-sm text-muted-foreground">No custom categories yet.</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Create categories to organise your expenses beyond the built-in types like Software, Travel, etc.
              </p>
              <Button variant="outline" size="sm" onClick={openCreate}>
                <Plus className="size-3.5" /> Create first category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-4">Color</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Expenses</TableHead>
                  <TableHead className="w-28 text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="pl-4">
                      <div
                        className="size-5 rounded-full border shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: cat.color }}
                        >
                          {cat.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-64 truncate">
                      {cat.description ?? <span className="italic opacity-50">No description</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {cat.expenseCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon-sm" variant="ghost" title="Edit"
                          onClick={() => openEdit(cat)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <DeleteCell cat={cat} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Built-in categories info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Built-in categories</CardTitle>
          <CardDescription>
            These 7 categories are always available and cannot be removed. Create custom categories above to supplement them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["Software", "Hardware", "Marketing", "Travel", "Salaries", "Office", "Other"].map((label) => (
              <span key={label}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                {label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <CategoryFormDialog
            initial={editTarget}
            onClose={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
