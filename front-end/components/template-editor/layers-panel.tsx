"use client"

/**
 * components/template-editor/layers-panel.tsx
 *
 * Left-side layers list — mirrors Figma's layers panel.
 *
 * Features:
 *   - Ordered list of elements (top z-index first, so visually "above" = top of list)
 *   - Click to select
 *   - Double-click label to rename inline
 *   - Eye icon   — toggle visibility
 *   - Lock icon  — toggle locked
 *   - Up/down arrows — z-index reorder
 *   - Trash icon — delete (with confirmation for locked elements)
 *   - Type badge (T / ▭ / 🖼 / ⬚) with colour coding
 */

import * as React from "react"
import {
  Eye, EyeOff, Lock, Unlock, Trash2,
  ChevronUp, ChevronDown, Type, Square, Image, FormInput,
} from "lucide-react"
import type { CanvasElement } from "@/lib/canvas-types"
import type { CanvasEngine } from "@/hooks/use-canvas-engine"
import { cn } from "@/lib/utils"

// ── Type icon + colour ────────────────────────────────────────────────────────

const TYPE_META: Record<
  CanvasElement["type"],
  { icon: React.ElementType; label: string; colour: string }
> = {
  "text":        { icon: Type,      label: "Text",        colour: "text-violet-500" },
  "shape":       { icon: Square,    label: "Shape",       colour: "text-blue-500"   },
  "image":       { icon: Image,     label: "Image",       colour: "text-emerald-500"},
  "input-field": { icon: FormInput, label: "Input Field", colour: "text-amber-500"  },
}

// ── Single layer row ──────────────────────────────────────────────────────────

function LayerRow({
  el,
  isSelected,
  isFirst,
  isLast,
  engine,
}: {
  el:         CanvasElement
  isSelected: boolean
  isFirst:    boolean   // highest z-index — can't go further up
  isLast:     boolean   // lowest  z-index — can't go further down
  engine:     CanvasEngine
}) {
  const [editing,  setEditing]  = React.useState(false)
  const [draftLabel, setDraftLabel] = React.useState(el.label)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const meta = TYPE_META[el.type]

  function commitRename() {
    const trimmed = draftLabel.trim()
    if (trimmed && trimmed !== el.label) {
      engine.updateElement(el.id, { label: trimmed })
    } else {
      setDraftLabel(el.label) // reset if blank or unchanged
    }
    setEditing(false)
  }

  function startEditing() {
    setDraftLabel(el.label)
    setEditing(true)
    // focus after render
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter")  commitRename()
    if (e.key === "Escape") { setDraftLabel(el.label); setEditing(false) }
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-1.5 px-2 py-[5px] cursor-pointer select-none",
        "rounded-md transition-colors text-sm",
        isSelected
          ? "bg-primary/10 text-foreground"
          : "hover:bg-muted/60 text-muted-foreground hover:text-foreground",
        !el.visible && "opacity-40",
      )}
      onClick={() => engine.selectElement(el.id)}
    >
      {/* Type icon */}
      <meta.icon
        className={cn("size-3.5 shrink-0", meta.colour)}
        aria-label={meta.label}
      />

      {/* Label — double-click to rename */}
      {editing ? (
        <input
          ref={inputRef}
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 bg-background border border-primary/40 rounded px-1 py-0 text-xs outline-none"
          autoFocus
        />
      ) : (
        <span
          className="flex-1 min-w-0 truncate text-xs"
          title={el.label}
          onDoubleClick={(e) => { e.stopPropagation(); startEditing() }}
        >
          {el.label}
        </span>
      )}

      {/* Action buttons — visible on hover or when selected */}
      <div
        className={cn(
          "flex items-center gap-0.5 shrink-0",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          isSelected && "opacity-100",
        )}
      >
        {/* Visibility */}
        <button
          type="button"
          title={el.visible ? "Hide" : "Show"}
          onClick={(e) => { e.stopPropagation(); engine.updateElement(el.id, { visible: !el.visible }) }}
          className="size-5 flex items-center justify-center rounded hover:bg-muted transition-colors"
        >
          {el.visible
            ? <Eye    className="size-3" />
            : <EyeOff className="size-3 text-muted-foreground" />}
        </button>

        {/* Lock */}
        <button
          type="button"
          title={el.locked ? "Unlock" : "Lock"}
          onClick={(e) => { e.stopPropagation(); engine.updateElement(el.id, { locked: !el.locked }) }}
          className="size-5 flex items-center justify-center rounded hover:bg-muted transition-colors"
        >
          {el.locked
            ? <Lock   className="size-3 text-amber-500" />
            : <Unlock className="size-3" />}
        </button>

        {/* Move up */}
        <button
          type="button"
          title="Bring forward"
          disabled={isFirst}
          onClick={(e) => { e.stopPropagation(); engine.moveElementUp(el.id) }}
          className="size-5 flex items-center justify-center rounded hover:bg-muted transition-colors disabled:opacity-20"
        >
          <ChevronUp className="size-3" />
        </button>

        {/* Move down */}
        <button
          type="button"
          title="Send backward"
          disabled={isLast}
          onClick={(e) => { e.stopPropagation(); engine.moveElementDown(el.id) }}
          className="size-5 flex items-center justify-center rounded hover:bg-muted transition-colors disabled:opacity-20"
        >
          <ChevronDown className="size-3" />
        </button>

        {/* Delete */}
        <button
          type="button"
          title="Delete element"
          onClick={(e) => {
            e.stopPropagation()
            if (el.locked) {
              if (!window.confirm(`"${el.label}" is locked. Delete anyway?`)) return
            }
            engine.deleteElement(el.id)
          }}
          className="size-5 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <Trash2 className="size-3" />
        </button>
      </div>
    </div>
  )
}

// ── Layers panel ──────────────────────────────────────────────────────────────

interface LayersPanelProps {
  engine: CanvasEngine
}

export function LayersPanel({ engine }: LayersPanelProps) {
  const { sortedElements, selectedId } = engine

  // Reversed so highest z-index (visually on top) appears first in the list
  const layers = [...sortedElements].reverse()

  return (
    <div className="flex flex-col h-full" style={{ background: "#ffffff", color: "#111827" }}>
      {/* Header */}
      <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ background: "#ffffff" }}>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Layers
        </span>
        <span className="text-[10px] text-muted-foreground">
          {layers.length} element{layers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto p-1.5">
        {layers.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center mt-6 px-4">
            No elements yet. Use the toolbar to add text, shapes, or images.
          </p>
        ) : (
          layers.map((el, i) => (
            <LayerRow
              key={el.id}
              el={el}
              isSelected={el.id === selectedId}
              isFirst={i === 0}                    // highest z = first in reversed list
              isLast={i === layers.length - 1}     // lowest  z = last
              engine={engine}
            />
          ))
        )}
      </div>
    </div>
  )
}
