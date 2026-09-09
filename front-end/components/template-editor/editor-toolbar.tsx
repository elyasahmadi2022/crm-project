"use client"

/**
 * components/template-editor/editor-toolbar.tsx
 *
 * Top toolbar for the canvas editor.
 *
 * Left group  — Insert element buttons (Text / Rectangle / Image / Input Field)
 * Center      — Template name (editable inline)
 * Right group — Zoom control | Grid toggle | Undo hint | Save button
 */

import * as React from "react"
import {
  Type, Square, Image, FormInput,
  ZoomIn, ZoomOut, Grid3x3, Save, Loader2,
  ChevronLeft,
} from "lucide-react"
import { Button }    from "@/components/ui/button"
import { Input }     from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { CanvasEngine } from "@/hooks/use-canvas-engine"
import { cn } from "@/lib/utils"

// ── Insert button ─────────────────────────────────────────────────────────────

interface InsertBtnProps {
  icon:    React.ElementType
  label:   string
  onClick: () => void
  colour:  string
}

function InsertBtn({ icon: Icon, label, onClick, colour }: InsertBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium",
        "bg-muted/60 hover:bg-muted border border-transparent hover:border-muted-foreground/20",
        "transition-colors select-none",
      )}
    >
      <Icon className={cn("size-3.5 shrink-0", colour)} />
      {label}
    </button>
  )
}

// ── Zoom stepper ──────────────────────────────────────────────────────────────

const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2]

function ZoomControl({
  zoom,
  onChange,
}: {
  zoom:     number
  onChange: (z: number) => void
}) {
  function step(dir: 1 | -1) {
    const idx = ZOOM_STEPS.findIndex((z) => z >= zoom)
    const next = dir === 1
      ? ZOOM_STEPS[Math.min(idx + 1, ZOOM_STEPS.length - 1)]
      : ZOOM_STEPS[Math.max((idx === -1 ? ZOOM_STEPS.length - 1 : idx) - 1, 0)]
    onChange(next ?? zoom)
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => step(-1)}
        className="size-7 flex items-center justify-center rounded hover:bg-muted transition-colors"
        title="Zoom out"
      >
        <ZoomOut className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange(1)}
        className="h-7 px-2 rounded hover:bg-muted transition-colors text-xs tabular-nums min-w-[46px] text-center"
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        onClick={() => step(1)}
        className="size-7 flex items-center justify-center rounded hover:bg-muted transition-colors"
        title="Zoom in"
      >
        <ZoomIn className="size-3.5" />
      </button>
    </div>
  )
}

// ── Main toolbar ──────────────────────────────────────────────────────────────

export interface EditorToolbarProps {
  engine:          CanvasEngine
  templateName:    string
  onNameChange:    (name: string) => void
  zoom:            number
  onZoomChange:    (z: number) => void
  showGrid:        boolean
  onGridToggle:    () => void
  isSaving:        boolean
  isDirty:         boolean
  onSave:          () => void
  onBack:          () => void
}

export function EditorToolbar({
  engine,
  templateName,
  onNameChange,
  zoom,
  onZoomChange,
  showGrid,
  onGridToggle,
  isSaving,
  isDirty,
  onSave,
  onBack,
}: EditorToolbarProps) {
  const [editingName, setEditingName] = React.useState(false)
  const [draftName,   setDraftName]   = React.useState(templateName)

  React.useEffect(() => setDraftName(templateName), [templateName])

  function commitName() {
    setEditingName(false)
    const trimmed = draftName.trim()
    if (trimmed && trimmed !== templateName) onNameChange(trimmed)
    else setDraftName(templateName)
  }

  // Centre of the page — new elements drop here
  const { widthPx, heightPx } = engine.layout.page
  const cx = Math.round(widthPx  / 2 - 100)
  const cy = Math.round(heightPx / 2 - 40)

  return (
    <header className="h-12 shrink-0 flex items-center gap-2 px-3 border-b z-50" style={{ background: "#ffffff", color: "#111827", borderColor: "#e5e7eb" }}>
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="size-8 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground"
        title="Back to templates"
      >
        <ChevronLeft className="size-4" />
      </button>

      <Separator orientation="vertical" className="h-6" />

      {/* ── Insert group ──────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        <InsertBtn
          icon={Type}
          label="Text"
          colour="text-violet-500"
          onClick={() =>
            engine.addElement("text", { x: cx, y: cy, width: 200, height: 40 })
          }
        />
        <InsertBtn
          icon={Square}
          label="Rectangle"
          colour="text-blue-500"
          onClick={() =>
            engine.addElement("shape", { x: cx, y: cy, width: 160, height: 80 })
          }
        />
        <InsertBtn
          icon={Image}
          label="Image"
          colour="text-emerald-500"
          onClick={() =>
            engine.addElement("image", { x: cx, y: cy, width: 200, height: 120 })
          }
        />
        <InsertBtn
          icon={FormInput}
          label="Input Field"
          colour="text-amber-500"
          onClick={() =>
            engine.addElement("input-field", { x: cx, y: cy, width: 240, height: 36 })
          }
        />
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* ── Template name (centre) ────────────────────────────── */}
      <div className="flex-1 flex justify-center min-w-0">
        {editingName ? (
          <Input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter")  commitName()
              if (e.key === "Escape") { setDraftName(templateName); setEditingName(false) }
            }}
            className="h-7 text-sm font-medium text-center max-w-[280px] bg-muted/50 border-primary/40"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            title="Click to rename template"
            className={cn(
              "text-sm font-medium truncate max-w-[280px] px-2 py-1 rounded",
              "hover:bg-muted/60 transition-colors",
              isDirty && "text-amber-600 dark:text-amber-400",
            )}
          >
            {templateName}
            {isDirty && " •"}
          </button>
        )}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* ── Right group ───────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {/* Grid toggle */}
        <button
          type="button"
          onClick={onGridToggle}
          title={showGrid ? "Hide grid" : "Show grid"}
          className={cn(
            "size-8 flex items-center justify-center rounded transition-colors",
            showGrid ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground",
          )}
        >
          <Grid3x3 className="size-4" />
        </button>

        {/* Zoom */}
        <ZoomControl zoom={zoom} onChange={onZoomChange} />

        <Separator orientation="vertical" className="h-6" />

        {/* Save */}
        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="h-8 gap-1.5"
        >
          {isSaving
            ? <Loader2 className="size-3.5 animate-spin" />
            : <Save    className="size-3.5" />}
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>
    </header>
  )
}
