"use client"

/**
 * app/(admin)/admin/templates/[id]/edit/page.tsx
 *
 * Figma-style full-screen canvas editor for a single ContractTemplate.
 *
 * Layout (3-panel, fills 100vh):
 * ┌──────────────────────────────────────────────────────┐
 * │                  EditorToolbar (h-12)                │
 * ├─────────────┬──────────────────────────┬────────────┤
 * │ LayersPanel │   CanvasRenderer (scroll) │ PropsPanel │
 * │  (w-52)     │      (flex-1)            │  (w-72)    │
 * └─────────────┴──────────────────────────┴────────────┘
 *
 * Data flow:
 *   1. Fetch ContractTemplate by id
 *   2. Parse layoutJson → TemplateLayout (fall back to makeBlankLayout)
 *   3. Pass to useCanvasEngine → engine
 *   4. Dirty-track: compare JSON.stringify(engine.layout) vs saved
 *   5. Save: useSaveLayoutMutation + useUpdateTemplateMutation (for name changes)
 */

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { useCanvasEngine }   from "@/hooks/use-canvas-engine"
import { CanvasRenderer }    from "@/components/template-editor/canvas-renderer"
import { LayersPanel }       from "@/components/template-editor/layers-panel"
import { PropertiesPanel }   from "@/components/template-editor/properties-panel"
import { EditorToolbar }     from "@/components/template-editor/editor-toolbar"

import {
  useContractTemplatesQuery,
  useSaveLayoutMutation,
  useUpdateTemplateMutation,
} from "@/queries/company.queries"
import { makeBlankLayout }   from "@/lib/canvas-types"
import type { TemplateLayout } from "@/lib/canvas-types"

// ── Parse helper ──────────────────────────────────────────────────────────────

function parseLayout(json: string | null | undefined): TemplateLayout {
  if (!json) return makeBlankLayout()
  try {
    const parsed = JSON.parse(json) as unknown
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "version" in parsed &&
      "page"     in parsed &&
      "elements" in parsed
    ) {
      return parsed as TemplateLayout
    }
  } catch {
    // fall through
  }
  return makeBlankLayout()
}

// ── Editor inner (rendered once template is loaded) ───────────────────────────

function CanvasEditor({
  templateId,
  initialLayoutJson,
  initialName,
}: {
  templateId:        number
  initialLayoutJson: string | null
  initialName:       string
}) {
  const router = useRouter()

  const [zoom,     setZoom]     = React.useState(0.75)
  const [showGrid, setShowGrid] = React.useState(false)
  const [name,     setName]     = React.useState(initialName)

  // ── Engine ─────────────────────────────────────────────────────────────────
  const initialLayout = React.useMemo(
    () => parseLayout(initialLayoutJson),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // parse once — subsequent changes come from engine
  )

  const engine = useCanvasEngine(initialLayout)

  // ── Dirty tracking ─────────────────────────────────────────────────────────
  const savedJsonRef = React.useRef(JSON.stringify(initialLayout))
  const isDirty      = JSON.stringify(engine.layout) !== savedJsonRef.current

  // ── Mutations ──────────────────────────────────────────────────────────────
  const saveLayoutMut  = useSaveLayoutMutation()
  const updateNameMut  = useUpdateTemplateMutation()
  const isSaving       = saveLayoutMut.isPending || updateNameMut.isPending

  function handleSave() {
    const layoutJson = JSON.stringify(engine.layout)
    saveLayoutMut.mutate(
      { id: templateId, layoutJson },
      {
        onSuccess: () => {
          savedJsonRef.current = layoutJson
        },
      },
    )
  }

  function handleNameChange(newName: string) {
    setName(newName)
    updateNameMut.mutate({ id: templateId, dto: { name: newName } })
  }

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return

      // Ctrl/Cmd + S → Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        if (isDirty && !isSaving) handleSave()
        return
      }
      // Delete / Backspace → delete selected element
      if ((e.key === "Delete" || e.key === "Backspace") && engine.selectedId) {
        engine.deleteElement(engine.selectedId)
        return
      }
      // Escape → deselect
      if (e.key === "Escape") {
        engine.selectElement(null)
        return
      }
      // Ctrl/Cmd + D → duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && engine.selectedId) {
        e.preventDefault()
        engine.duplicateElement(engine.selectedId)
        return
      }
      // Arrow keys → nudge selected element
      if (engine.selectedId && ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        e.preventDefault()
        const el = engine.getSelectedElement()
        if (!el || el.locked) return
        const step = e.shiftKey ? 10 : 1
        const delta = {
          ArrowUp:    { y: el.y - step },
          ArrowDown:  { y: el.y + step },
          ArrowLeft:  { x: el.x - step },
          ArrowRight: { x: el.x + step },
        }[e.key]!
        engine.updateElement(engine.selectedId, delta)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, isSaving, engine.selectedId])

  return (
    <div className="flex flex-col h-full -m-3 overflow-hidden" style={{ background: "#ffffff", color: "#111827" }}>
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <EditorToolbar
        engine={engine}
        templateName={name}
        onNameChange={handleNameChange}
        zoom={zoom}
        onZoomChange={setZoom}
        showGrid={showGrid}
        onGridToggle={() => setShowGrid((v) => !v)}
        isSaving={isSaving}
        isDirty={isDirty}
        onSave={handleSave}
        onBack={() => router.push("/admin/templates")}
      />

      {/* ── Three-panel body ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Layers */}
        <aside className="w-52 shrink-0 border-r overflow-hidden flex flex-col" style={{ background: "#ffffff" }}>
          <LayersPanel engine={engine} />
        </aside>

        {/* Centre: Canvas — light grey surround like Figma */}
        <main className="flex-1 overflow-hidden flex flex-col" style={{ background: "#f1f5f9" }}>
          <CanvasRenderer engine={engine} zoom={zoom} showGrid={showGrid} />
        </main>

        {/* Right: Properties */}
        <aside className="w-72 shrink-0 border-l overflow-hidden flex flex-col" style={{ background: "#ffffff" }}>
          <PropertiesPanel engine={engine} />
        </aside>
      </div>
    </div>
  )
}

// ── Route component ───────────────────────────────────────────────────────────

export default function TemplateEditPage() {
  const params     = useParams<{ id: string }>()
  const templateId = Number(params.id)

  const { data: templates, isLoading } = useContractTemplatesQuery()
  const template = templates?.find((t) => t.id === templateId)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading template…
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Template not found</p>
          <p className="text-sm text-muted-foreground">ID {templateId} does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <CanvasEditor
      key={template.id}             // remount if user switches templates
      templateId={template.id}
      initialLayoutJson={template.layoutJson}
      initialName={template.name}
    />
  )
}
