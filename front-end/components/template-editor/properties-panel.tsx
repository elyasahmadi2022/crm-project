"use client"

/**
 * components/template-editor/properties-panel.tsx
 *
 * Right-side properties panel — context-sensitive per element type.
 *
 * Sections shown:
 *   All elements  → Transform (x, y, w, h, rotation), Arrange (z-index actions)
 *   text          → Typography (font size, weight, style, align, line-height, letter-spacing, color, opacity)
 *   shape         → Fill (bg color, opacity, border-radius)
 *   image         → Image src URL
 *   input-field   → Field label / placeholder
 *   All elements  → Border (width, color, style, radius)
 *   All elements  → Shadow (x, y, blur, color, opacity)
 *   No selection  → Page config (bg, width, height, orientation)
 */

import * as React from "react"
import {
  AlignLeft, AlignCenter, AlignRight,
  BringToFront, SendToBack, ChevronsUp, ChevronsDown,
  Copy, Trash2, Link,
} from "lucide-react"
import { Input }     from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { CanvasElement, ElementStyle, PageConfig } from "@/lib/canvas-types"
import { PAGE_SIZE_PRESETS, makePageConfig } from "@/lib/canvas-types"
import type { CanvasEngine } from "@/hooks/use-canvas-engine"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────────────────────────────────
// Primitive controls
// ─────────────────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
        {title}
      </p>
      {children}
    </div>
  )
}

function Row({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", wide ? "flex-col items-start gap-1" : "justify-between")}>
      <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 w-20">{label}</span>
      <div className="flex-1 flex justify-end">{children}</div>
    </div>
  )
}

/** Small number stepper used for x/y/w/h/rotation */
function NumInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  className,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  className?: string
}) {
  const [raw, setRaw] = React.useState(String(Math.round(value)))
  React.useEffect(() => setRaw(String(Math.round(value))), [value])

  function commit(v: string) {
    const n = parseFloat(v)
    if (!isNaN(n)) {
      const clamped = min !== undefined ? Math.max(min, max !== undefined ? Math.min(max, n) : n) : n
      onChange(clamped)
      setRaw(String(Math.round(clamped)))
    } else {
      setRaw(String(Math.round(value)))
    }
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <Input
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit((e.target as HTMLInputElement).value) }}
        className="h-6 w-16 text-xs text-center px-1 bg-muted/50 border-muted"
      />
      {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
    </div>
  )
}

/** Inline colour swatch + hex input */
function ColorInput({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (v: string) => void
  label?: string
}) {
  const id = React.useId()
  return (
    <div className="flex items-center gap-1.5">
      {label && <span className="text-[11px] text-muted-foreground w-20 shrink-0">{label}</span>}
      <div className="relative">
        <div
          className="size-6 rounded border border-white/20 shadow-sm cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => document.getElementById(id)?.click()}
        />
        <input
          id={id}
          type="color"
          value={value.startsWith("#") ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={9}
        className="h-6 w-[74px] font-mono text-[11px] px-1.5 bg-muted/50 border-muted"
      />
    </div>
  )
}

/** 0–100 opacity slider + numeric input */
function OpacityInput({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2 w-full">
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 accent-primary"
      />
      <NumInput value={value} onChange={onChange} min={0} max={100} suffix="%" className="shrink-0" />
    </div>
  )
}

/** Segmented button group */
function SegmentGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: React.ReactNode; title?: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex">
      {options.map((opt, i) => (
        <button
          key={String(opt.value)}
          type="button"
          title={opt.title}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 h-7 flex items-center justify-center text-xs transition-colors",
            "border border-muted",
            i === 0 ? "rounded-l" : i === options.length - 1 ? "rounded-r -ml-px" : "-ml-px",
            value === opt.value
              ? "bg-primary text-primary-foreground border-primary z-10"
              : "bg-muted/50 hover:bg-muted",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section components
// ─────────────────────────────────────────────────────────────────────────────

function TransformSection({
  el,
  engine,
}: {
  el:     CanvasElement
  engine: CanvasEngine
}) {
  function upd(key: keyof Pick<CanvasElement, "x" | "y" | "width" | "height" | "rotation">) {
    return (v: number) => engine.updateElement(el.id, { [key]: v })
  }

  return (
    <Section title="Transform">
      {/* Position */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground w-3">X</span>
          <NumInput value={el.x} onChange={upd("x")} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground w-3">Y</span>
          <NumInput value={el.y} onChange={upd("y")} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground w-3">W</span>
          <NumInput value={el.width} onChange={upd("width")} min={1} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground w-3">H</span>
          <NumInput value={el.height} onChange={upd("height")} min={1} />
        </div>
      </div>
      <Row label="Rotation">
        <NumInput value={el.rotation} onChange={upd("rotation")} suffix="°" />
      </Row>
    </Section>
  )
}

function ArrangeSection({ el, engine }: { el: CanvasElement; engine: CanvasEngine }) {
  return (
    <Section title="Arrange">
      <div className="flex gap-1">
        <button
          type="button"
          title="Bring to front"
          onClick={() => engine.bringToFront(el.id)}
          className="flex-1 h-7 flex items-center justify-center gap-1 text-[11px] rounded bg-muted/60 hover:bg-muted transition-colors"
        >
          <BringToFront className="size-3.5" /> Front
        </button>
        <button
          type="button"
          title="Send to back"
          onClick={() => engine.sendToBack(el.id)}
          className="flex-1 h-7 flex items-center justify-center gap-1 text-[11px] rounded bg-muted/60 hover:bg-muted transition-colors"
        >
          <SendToBack className="size-3.5" /> Back
        </button>
        <button
          type="button"
          title="Move forward"
          onClick={() => engine.moveElementUp(el.id)}
          className="h-7 w-8 flex items-center justify-center rounded bg-muted/60 hover:bg-muted transition-colors"
        >
          <ChevronsUp className="size-3.5" />
        </button>
        <button
          type="button"
          title="Move backward"
          onClick={() => engine.moveElementDown(el.id)}
          className="h-7 w-8 flex items-center justify-center rounded bg-muted/60 hover:bg-muted transition-colors"
        >
          <ChevronsDown className="size-3.5" />
        </button>
      </div>
      {/* Quick actions */}
      <div className="flex gap-1">
        <button
          type="button"
          title="Duplicate"
          onClick={() => engine.duplicateElement(el.id)}
          className="flex-1 h-7 flex items-center justify-center gap-1 text-[11px] rounded bg-muted/60 hover:bg-muted transition-colors"
        >
          <Copy className="size-3" /> Duplicate
        </button>
        <button
          type="button"
          title="Delete"
          onClick={() => engine.deleteElement(el.id)}
          className="flex-1 h-7 flex items-center justify-center gap-1 text-[11px] rounded bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
        >
          <Trash2 className="size-3" /> Delete
        </button>
      </div>
    </Section>
  )
}

function FillSection({
  el,
  engine,
}: {
  el:     CanvasElement
  engine: CanvasEngine
}) {
  const s = el.style
  function upd(k: keyof ElementStyle) {
    return (v: unknown) => engine.updateStyle(el.id, { [k]: v } as Partial<ElementStyle>)
  }

  return (
    <Section title="Fill">
      <ColorInput
        label="Color"
        value={s.backgroundColor}
        onChange={upd("backgroundColor") as (v: string) => void}
      />
      <Row label="Opacity">
        <OpacityInput value={s.backgroundOpacity} onChange={upd("backgroundOpacity") as (v: number) => void} />
      </Row>
      <Row label="Radius">
        <NumInput value={s.borderRadius} onChange={upd("borderRadius") as (v: number) => void} min={0} suffix="px" />
      </Row>
    </Section>
  )
}

function TypographySection({
  el,
  engine,
}: {
  el:     CanvasElement
  engine: CanvasEngine
}) {
  const s = el.style
  function upd(k: keyof ElementStyle) {
    return (v: unknown) => engine.updateStyle(el.id, { [k]: v } as Partial<ElementStyle>)
  }

  return (
    <Section title="Typography">
      <ColorInput
        label="Color"
        value={s.color}
        onChange={upd("color") as (v: string) => void}
      />
      <Row label="Opacity">
        <OpacityInput value={s.textOpacity} onChange={upd("textOpacity") as (v: number) => void} />
      </Row>
      <Row label="Size">
        <NumInput value={s.fontSize} onChange={upd("fontSize") as (v: number) => void} min={6} max={200} suffix="px" />
      </Row>
      <Row label="Weight">
        <SegmentGroup
          value={s.fontWeight}
          onChange={upd("fontWeight") as (v: typeof s.fontWeight) => void}
          options={[
            { value: "normal",   label: "Normal",   title: "Normal" },
            { value: "semibold", label: "Semi",     title: "Semibold" },
            { value: "bold",     label: "Bold",     title: "Bold" },
          ]}
        />
      </Row>
      <Row label="Style">
        <SegmentGroup
          value={s.fontStyle}
          onChange={upd("fontStyle") as (v: typeof s.fontStyle) => void}
          options={[
            { value: "normal", label: "Regular", title: "Normal" },
            { value: "italic", label: <em>Italic</em>, title: "Italic" },
          ]}
        />
      </Row>
      <Row label="Align">
        <SegmentGroup
          value={s.textAlign}
          onChange={upd("textAlign") as (v: typeof s.textAlign) => void}
          options={[
            { value: "left",   label: <AlignLeft  className="size-3.5" />, title: "Left"   },
            { value: "center", label: <AlignCenter className="size-3.5" />, title: "Center" },
            { value: "right",  label: <AlignRight  className="size-3.5" />, title: "Right"  },
          ]}
        />
      </Row>
      <Row label="Line height">
        <NumInput
          value={s.lineHeight}
          onChange={upd("lineHeight") as (v: number) => void}
          min={0.5} max={5} step={0.1}
        />
      </Row>
      <Row label="Spacing">
        <NumInput
          value={s.letterSpacing}
          onChange={upd("letterSpacing") as (v: number) => void}
          min={-10} max={50} step={0.5}
          suffix="px"
        />
      </Row>
    </Section>
  )
}

function ContentSection({
  el,
  engine,
}: {
  el:     CanvasElement
  engine: CanvasEngine
}) {
  const [draft, setDraft] = React.useState(el.content)
  React.useEffect(() => setDraft(el.content), [el.content])

  function commit() {
    engine.updateElement(el.id, { content: draft })
  }

  if (el.type === "text") {
    return (
      <Section title="Content">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          rows={4}
          className="w-full resize-none rounded border border-muted bg-muted/50 px-2 py-1.5 text-xs outline-none focus:border-primary/50 transition-colors"
          placeholder="Enter text or {{variable.key}}"
        />
        <p className="text-[10px] text-muted-foreground">
          Use <code className="font-mono">{"{{variable.key}}"}</code> for dynamic values.
        </p>
      </Section>
    )
  }

  if (el.type === "input-field") {
    return (
      <Section title="Field">
        <Row label="Label">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            className="h-7 text-xs bg-muted/50 border-muted"
            placeholder="Field label"
          />
        </Row>
        <DataKeyRow el={el} engine={engine} />
      </Section>
    )
  }

  if (el.type === "image") {
    return (
      <Section title="Image">
        <Row label="URL" wide>
          <Input
            value={el.style.backgroundImage ?? ""}
            onChange={(e) =>
              engine.updateStyle(el.id, { backgroundImage: e.target.value || null })
            }
            className="h-7 text-xs bg-muted/50 border-muted w-full"
            placeholder="https://…"
          />
        </Row>
        <DataKeyRow el={el} engine={engine} />
      </Section>
    )
  }

  return null
}

function DataKeyRow({ el, engine }: { el: CanvasElement; engine: CanvasEngine }) {
  const [draft, setDraft] = React.useState(el.dataKey ?? "")
  React.useEffect(() => setDraft(el.dataKey ?? ""), [el.dataKey])

  return (
    <Row label="Data key" wide>
      <div className="flex items-center gap-1 w-full">
        <Link className="size-3 text-muted-foreground shrink-0" />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => engine.updateElement(el.id, { dataKey: draft.trim() || null })}
          className="h-7 text-xs bg-muted/50 border-muted flex-1"
          placeholder="customer.name"
        />
      </div>
    </Row>
  )
}

function BorderSection({
  el,
  engine,
}: {
  el:     CanvasElement
  engine: CanvasEngine
}) {
  const s = el.style
  function upd(k: keyof ElementStyle) {
    return (v: unknown) => engine.updateStyle(el.id, { [k]: v } as Partial<ElementStyle>)
  }

  return (
    <Section title="Border">
      <Row label="Width">
        <NumInput value={s.borderWidth} onChange={upd("borderWidth") as (v: number) => void} min={0} max={20} suffix="px" />
      </Row>
      {s.borderWidth > 0 && (
        <>
          <ColorInput label="Color" value={s.borderColor} onChange={upd("borderColor") as (v: string) => void} />
          <Row label="Style">
            <SegmentGroup
              value={s.borderStyle}
              onChange={upd("borderStyle") as (v: typeof s.borderStyle) => void}
              options={[
                { value: "solid",  label: "Solid"  },
                { value: "dashed", label: "Dashed" },
                { value: "dotted", label: "Dotted" },
              ]}
            />
          </Row>
        </>
      )}
    </Section>
  )
}

function ShadowSection({
  el,
  engine,
}: {
  el:     CanvasElement
  engine: CanvasEngine
}) {
  const s = el.style
  function upd(k: keyof ElementStyle) {
    return (v: unknown) => engine.updateStyle(el.id, { [k]: v } as Partial<ElementStyle>)
  }

  return (
    <Section title="Shadow">
      <Row label="Opacity">
        <OpacityInput value={s.shadowOpacity} onChange={upd("shadowOpacity") as (v: number) => void} />
      </Row>
      {s.shadowOpacity > 0 && (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground w-3">X</span>
              <NumInput value={s.shadowX} onChange={upd("shadowX") as (v: number) => void} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground w-3">Y</span>
              <NumInput value={s.shadowY} onChange={upd("shadowY") as (v: number) => void} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground w-4">Blur</span>
              <NumInput value={s.shadowBlur} onChange={upd("shadowBlur") as (v: number) => void} min={0} />
            </div>
          </div>
          <ColorInput label="Color" value={s.shadowColor} onChange={upd("shadowColor") as (v: string) => void} />
        </>
      )}
    </Section>
  )
}

function PaddingSection({
  el,
  engine,
}: {
  el:     CanvasElement
  engine: CanvasEngine
}) {
  const s = el.style
  function upd(k: keyof ElementStyle) {
    return (v: number) => engine.updateStyle(el.id, { [k]: v } as Partial<ElementStyle>)
  }

  return (
    <Section title="Padding">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground w-5">Top</span>
          <NumInput value={s.paddingTop}    onChange={upd("paddingTop")}    min={0} suffix="px" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground w-5">Right</span>
          <NumInput value={s.paddingRight}  onChange={upd("paddingRight")}  min={0} suffix="px" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground w-5">Bot</span>
          <NumInput value={s.paddingBottom} onChange={upd("paddingBottom")} min={0} suffix="px" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground w-5">Left</span>
          <NumInput value={s.paddingLeft}   onChange={upd("paddingLeft")}   min={0} suffix="px" />
        </div>
      </div>
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// No-selection: Page config panel
// ─────────────────────────────────────────────────────────────────────────────

function PageSection({ engine }: { engine: CanvasEngine }) {
  const { page } = engine.layout

  const presetOpts = Object.keys(PAGE_SIZE_PRESETS) as (keyof typeof PAGE_SIZE_PRESETS)[]

  function changePreset(preset: string) {
    const newPage = makePageConfig(preset as PageConfig["preset"], page.orientation)
    engine.updatePage(newPage)
  }

  function changeOrientation(orientation: PageConfig["orientation"]) {
    const newPage = makePageConfig(page.preset, orientation)
    engine.updatePage(newPage)
  }

  return (
    <div className="flex flex-col gap-0">
      <Section title="Page">
        <Row label="Size">
          <select
            value={page.preset}
            onChange={(e) => changePreset(e.target.value)}
            className="h-7 flex-1 rounded border border-muted bg-muted/50 text-xs px-2 outline-none focus:border-primary/50"
          >
            {presetOpts.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
            <option value="Custom">Custom</option>
          </select>
        </Row>
        <Row label="Orientation">
          <SegmentGroup
            value={page.orientation}
            onChange={changeOrientation}
            options={[
              { value: "portrait",  label: "Portrait"  },
              { value: "landscape", label: "Landscape" },
            ]}
          />
        </Row>
        <Row label="W × H">
          <span className="text-[11px] text-muted-foreground">
            {page.widthPx} × {page.heightPx} px
          </span>
        </Row>
      </Section>
      <Separator />
      <Section title="Background">
        <ColorInput
          label="Color"
          value={page.background}
          onChange={(v) => engine.updatePage({ background: v })}
        />
      </Section>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────────────────────

interface PropertiesPanelProps {
  engine: CanvasEngine
}

export function PropertiesPanel({ engine }: PropertiesPanelProps) {
  const el = engine.getSelectedElement()

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: "#ffffff", color: "#111827" }}>
      {/* Header */}
      <div className="px-3 py-2.5 border-b shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {el ? el.label : "Page"}
        </span>
      </div>

      {el ? (
        /* ── Element properties ───────────────────────────────────── */
        <div className="flex flex-col divide-y">
          <TransformSection  el={el} engine={engine} />
          <ArrangeSection    el={el} engine={engine} />

          {/* Content (text body / image URL / field label) */}
          {(el.type === "text" || el.type === "image" || el.type === "input-field") && (
            <>
              <Separator />
              <ContentSection el={el} engine={engine} />
            </>
          )}

          {/* Fill — shapes + images have visible fill */}
          {(el.type === "shape" || el.type === "image") && (
            <>
              <Separator />
              <FillSection el={el} engine={engine} />
            </>
          )}

          {/* Typography — text + input-field */}
          {(el.type === "text" || el.type === "input-field") && (
            <>
              <Separator />
              <TypographySection el={el} engine={engine} />
            </>
          )}

          <Separator />
          <BorderSection el={el} engine={engine} />

          <Separator />
          <ShadowSection el={el} engine={engine} />

          {/* Padding — text + input-field */}
          {(el.type === "text" || el.type === "input-field") && (
            <>
              <Separator />
              <PaddingSection el={el} engine={engine} />
            </>
          )}
        </div>
      ) : (
        /* ── Page properties (no selection) ──────────────────────── */
        <PageSection engine={engine} />
      )}
    </div>
  )
}
